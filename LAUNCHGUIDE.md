# Bounty Radar

## Tagline
Find funded GitHub bounty issues worth solving — scan boards, score ROI, plan the PR.

## Description
Bounty Radar turns the noisy world of paid open-source bounties into a ranked, actionable feed for AI agents and solo developers. It scans live bounty sources (GitHub issue labels used by Algora, Opire, Polar, Bountysource-style boards), extracts reward amounts in USD, filters out stale or unverifiable listings, and returns a scored shortlist with the metadata an agent needs to decide whether to attempt a fix: repo, language, issue age, reward, labels, and direct links. Built by a production multi-agent system that races on these bounties daily, it encodes real heuristics: reward-per-effort scoring, freshness weighting, and scam/spam rejection. Use it to hunt paid work on autopilot or to brief your coding agent before it writes a single line.

## Setup Requirements
- `MCP_LICENSE_KEY` (required): Your license key from the purchase, shown right after checkout and in your MCP Marketplace dashboard (License Keys tab). Install command: `npx -y bounty-radar-mcp`.
- `GITHUB_TOKEN` (optional): A GitHub personal access token for higher API rate limits (60/hr unauthenticated, 5000/hr authenticated). https://github.com/settings/tokens — no scopes required for public data.

## Category
Developer Tools

## Features
- Scan live GitHub bounty boards and label patterns used by real funding platforms
- Extract and normalize reward amounts in USD from titles, labels, and bodies
- Score each bounty by reward size, freshness, and attempt-worthiness
- Filter out stale (>90 days), unlabeled, or reward-less noise automatically
- Return structured JSON shortlists ready for agent decision-making
- Rank issues across repos so agents pick the best-EV work first
- Explain scoring: every bounty includes the reason it ranked where it did
- Zero dependencies — pure Node.js stdio server, runs anywhere MCP runs
- Works offline-friendly: deterministic scoring, no model calls required
- Battle-tested heuristics from a system that submits real bounty PRs daily

## Getting Started
- "Scan GitHub for funded bounty issues I could actually win"
- "Show me the top-scoring bounties opened this week under the 'bounty' label"
- Tool: bounty_scan — Scan configured sources and return a scored, deduplicated list of funded issues
- Tool: bounty_score — Score a single issue URL for reward, freshness, and win-probability signals
- Tool: bounty_plan — Given an issue, draft an attempt plan: files likely touched, test strategy, PR checklist
- Tool: sources_list — List the board/label patterns currently scanned and their last-seen hit counts

## Tags
bounty, github, freelance, paid-issues, algora, opire, developer-tools, scanning, ranking, agents

## Documentation URL
https://github.com/tony88pisa/bounty-radar-mcp/blob/master/README.md

## Health Check URL
