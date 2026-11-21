#!/usr/bin/env node
// bounty-radar-mcp — zero-dependency MCP server (stdio JSON-RPC)
// Tools: bounty_scan, bounty_score, bounty_platforms, bounty_pr_plan
const TOKEN = process.env.GITHUB_TOKEN || '';
const UA = { 'User-Agent': 'bounty-radar-mcp/1.0', 'Accept': 'application/vnd.github+json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) };
let buf = '';
process.stdin.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); if (line.trim()) handle(line).catch(() => {}); } });
const send = o => process.stdout.write(JSON.stringify(o) + '\n');

const TOOLS = [
  { name: 'bounty_scan', description: 'Scan GitHub for open issues that carry a monetary bounty (labels: bounty, help-wanted funding boards like Algora/Polar/Opire/Expensify). Returns ranked candidates with score 0-100.', inputSchema: { type: 'object', properties: {
      min_amount_usd: { type: 'number', description: 'Minimum USD reward (default 25)' },
      language: { type: 'string', description: 'Filter by repo language, e.g. Python, TypeScript' },
      query: { type: 'string', description: 'Extra GitHub search terms' },
      limit: { type: 'number', description: 'Max results (default 10, max 25)' } } } },
  { name: 'bounty_score', description: 'Score a single GitHub issue for bounty work: reward size, spec clarity, competition, freshness, repo health, AI policy risk.', inputSchema: { type: 'object', required: ['issue_url'], properties: { issue_url: { type: 'string', description: 'Full GitHub issue URL' } } } },
  { name: 'bounty_platforms', description: 'List the bounty platforms and funding rails this radar covers, with claim etiquette for each.', inputSchema: { type: 'object', properties: {} } },
  { name: 'bounty_pr_plan', description: 'Draft a claim-and-PR plan for a chosen bounty issue: files likely touched, approach, tests, PR title, claim etiquette.', inputSchema: { type: 'object', required: ['issue_url'], properties: { issue_url: { type: 'string' }, notes: { type: 'string', description: 'Your observations from reading the code' } } } }
];

async function gh(path) {
  const r = await fetch('https://api.github.com' + path, { headers: UA });
  if (!r.ok) throw new Error('GitHub ' + r.status + ' ' + (await r.text()).slice(0, 150));
  return r.json();
}

function score(issue, repo) {
  const title = issue.title || '', body = (issue.body || '').slice(0, 3000);
  const amt = Math.max(0, ...[...title.matchAll(/\$(\d[\d,]*)/g)].map(m => +m[1].replace(/,/g, '')));
  let s = 40;
  if (amt >= 500) s += 25; else if (amt >= 150) s += 20; else if (amt >= 50) s += 12; else if (amt > 0) s += 6;
  if (body.length > 800) s += 10; else if (body.length > 300) s += 5;
  if (/steps to reproduce|acceptance criteria|expected behavior/i.test(body)) s += 8;
  const comments = issue.comments || 0;
  if (comments === 0) s += 8; else if (comments <= 3) s += 4; else s -= 5;
  const age = (Date.now() - new Date(issue.created_at)) / 864e5;
  if (age < 14) s += 8; else if (age < 45) s += 4; else s -= 8;
  if (repo?.pushed_at && (Date.now() - new Date(repo.pushed_at)) / 864e5 < 30) s += 5;
  if (/ai[- ]?generated|no ai|chatgpt|llm/i.test(body) && /ban|forbidden|not accept/i.test(body)) s -= 20;
  if (issue.assignees?.length) s -= 15;
  return { score: Math.max(0, Math.min(100, s)), amountUsd: amt };
}

async function handle(line) {
  const m = JSON.parse(line);
  const reply = r => send({ jsonrpc: '2.0', id: m.id, ...r });
  if (m.method === 'initialize') return reply({ result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'bounty-radar-mcp', version: '1.0.0' } } });
  if (m.method === 'notifications/initialized' || m.method === 'ping') return m.id === undefined ? null : reply({ result: {} });
  if (m.method === 'tools/list') return reply({ result: { tools: TOOLS } });
  if (m.method === 'tools/call') {
    const { name, arguments: a = {} } = m.params;
    try {
      const out = await call(name, a);
      return reply({ result: { content: [{ type: 'text', text: out }] } });
    } catch (e) { return reply({ result: { content: [{ type: 'text', text: 'Error: ' + e.message }], isError: true } }); }
  }
  if (m.id !== undefined) reply({ error: { code: -32601, message: 'method not found' } });
}

async function call(name, a) {
  if (name === 'bounty_platforms') return `Bounty radar coverage & etiquette:
- GitHub label bounty: claim via comment per repo rules
- Expensify Help Wanted: $250 fixed — comment /attempt BEFORE opening PR, external contributor guide required
- Algora (/bounty in title or algora.io): auto-paid on merge via their escrow — check "attempted by" first
- Polar (polar.sh badges): funded pledges — payout on merge via Polar
- Opire: /rewards commands — claim via /try or their platform
- Drips Wave: labeled issues in funded ecosystems — points, human claim + KYC
General: never open a PR before checking for existing claims/PRs; disclose AI assistance where the repo asks for it.`;

  if (name === 'bounty_score') {
    const mm = (a.issue_url || '').match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (!mm) throw new Error('not a GitHub issue URL');
    const [, o, r, n] = mm;
    const [issue, repo] = await Promise.all([gh(`/repos/${o}/${r}/issues/${n}`), gh(`/repos/${o}/${r}`)]);
    const { score: sc, amountUsd } = score(issue, repo);
    return JSON.stringify({ repo: `${o}/${r}`, issue: +n, title: issue.title, amountUsd, score: sc, verdict: sc >= 70 ? 'STRONG CANDIDATE' : sc >= 50 ? 'WORTH A LOOK' : 'SKIP', signals: { comments: issue.comments, ageDays: Math.round((Date.now() - new Date(issue.created_at)) / 864e5), assigned: (issue.assignees || []).length, repoPushedDaysAgo: repo.pushed_at ? Math.round((Date.now() - new Date(repo.pushed_at)) / 864e5) : null } }, null, 2);
  }

  if (name === 'bounty_pr_plan') {
    const mm = (a.issue_url || '').match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (!mm) throw new Error('not a GitHub issue URL');
    const [, o, r, n] = mm;
    const issue = await gh(`/repos/${o}/${r}/issues/${n}`);
    return `PR plan for ${o}/${r}#${n} — "${issue.title}"

1. CLAIM FIRST: read the issue thread for claim commands (/attempt, /try, /bounty claim) and existing PRs. Comment your claim before writing code.
2. Reproduce: run the repo's own test/dev setup; write a failing test that captures the issue first.
3. Fix minimally — touch only what the issue needs; no drive-by refactors.
4. Verify: repo's test + lint + typecheck commands (from package.json scripts or .github/workflows).
5. PR: title "fix: <short> (#${n})", body links the issue, lists test output, discloses AI assistance if the repo requires it.
${a.notes ? 'Your notes folded in: ' + a.notes + '\n' : ''}
Issue body excerpt:
${(issue.body || '(empty)').slice(0, 1200)}`;
  }

  if (name === 'bounty_scan') {
    const lim = Math.min(+(a.limit || 10), 25), minAmt = +(a.min_amount_usd || 25);
    const lang = a.language ? ` language:"${a.language}"` : '';
    const extra = a.query ? ' ' + a.query : '';
    const q = 'bounty state:open type:issue' + lang + extra;
    const res = await gh(`/search/issues?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=${Math.min(lim * 3, 50)}`);
    const items = (res.items || []).map(i => ({ ...score(i, null), url: i.html_url, title: i.title, comments: i.comments, created: i.created_at }))
      .filter(x => x.amountUsd >= minAmt || x.score >= 55)
      .sort((x, y) => y.score - x.score).slice(0, lim);
    if (!items.length) return 'No candidates above thresholds — try lowering min_amount_usd or broadening the query.';
    return items.map((x, i) => `${i + 1}. [$${x.amountUsd || '?'} · score ${x.score}] ${x.title}\n   ${x.url} · ${x.comments} comments · opened ${x.created.slice(0, 10)}`).join('\n\n');
  }
  throw new Error('unknown tool ' + name);
}
