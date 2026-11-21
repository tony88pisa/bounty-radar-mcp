# bounty-radar-mcp

MCP server that turns "find me paid open-source work" into a ranked, actionable list — for any MCP-compatible agent (Claude Code/Desktop, Cursor, Gemini CLI, Codex, VS Code Copilot).

Zero dependencies. Node 18+. One file.

## Tools

| Tool | What it does |
|---|---|
| `bounty_scan` | Scans GitHub for open bounty-labeled issues (Algora, Polar, Opire, Expensify-style boards). Filters by min USD, language, extra terms. Returns top candidates ranked by 0-100 score. |
| `bounty_score` | Scores one issue URL: reward size, spec clarity, competition, freshness, repo health, AI-policy risk → verdict STRONG/WORTH A LOOK/SKIP. |
| `bounty_platforms` | Lists covered funding rails + the claim etiquette for each (so your agent doesn't burn a submission). |
| `bounty_pr_plan` | Drafts the claim → reproduce → minimal fix → verify → PR plan for a chosen issue. |

## Install

```json
{
  "mcpServers": {
    "bounty-radar": {
      "command": "node",
      "args": ["path/to/bounty-radar-mcp/server.js"]
    }
  }
}
```

Optional: set `GITHUB_TOKEN` for higher GitHub API rate limits (works without it at ~10 req/min).

## Example session

> You: use bounty_scan to find 5 TypeScript bounties over $100
> Agent calls `bounty_scan {language:"TypeScript", min_amount_usd:100, limit:5}`
> → ranked list with scores, amounts, links — then `bounty_pr_plan` on the top pick.

MIT license.
