# bounty-radar-mcp

MCP server that turns "find me paid open-source work" into a ranked, actionable list — for any MCP-compatible agent (Claude Code/Desktop, Cursor, Gemini CLI, Codex, VS Code Copilot).

Node 18+. One file. License-gated for [MCP Marketplace](https://mcp-marketplace.io/server/bounty-radar).

## Tools

| Tool | What it does |
|---|---|
| `bounty_scan` | Scans GitHub for open bounty-labeled issues (Algora, Polar, Opire, Expensify-style boards). Filters by min USD, language, extra terms. Returns top candidates ranked by 0-100 score. |
| `bounty_score` | Scores one issue URL: reward size, spec clarity, competition, freshness, repo health, AI-policy risk → verdict STRONG/WORTH A LOOK/SKIP. |
| `bounty_platforms` | Lists covered funding rails + the claim etiquette for each (so your agent doesn't burn a submission). |
| `bounty_pr_plan` | Drafts the claim → reproduce → minimal fix → verify → PR plan for a chosen issue. |

## Install (after purchase)

Buy a license at https://mcp-marketplace.io/server/bounty-radar — you get a key like `mcp_live_...`. Then add to your MCP client config:

```json
{
  "mcpServers": {
    "bounty-radar": {
      "command": "npx",
      "args": ["-y", "bounty-radar-mcp"],
      "env": {
        "MCP_LICENSE_KEY": "mcp_live_your_key_here",
        "GITHUB_TOKEN": "optional — raises GitHub API rate limits"
      }
    }
  }
}
```

The license key is verified once at startup and the approval is cached for 24h, so restarts work offline. `GITHUB_TOKEN` is optional (~10 req/min without it).

## Example session

> You: use bounty_scan to find 5 TypeScript bounties over $100
> Agent calls `bounty_scan {language:"TypeScript", min_amount_usd:100, limit:5}`
> → ranked list with scores, amounts, links — then `bounty_pr_plan` on the top pick.
