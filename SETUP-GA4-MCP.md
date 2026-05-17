# Google Analytics MCP — Setup

The official Google Analytics MCP server (`googleanalytics/google-analytics-mcp`, 2K+ stars, maintained by Google) is installed in this project. Once credentials are wired, Claude can query QuantOracle's GA4 property directly — top pages, funnels, realtime sessions, custom dimensions.

## What's already done

- `analytics-mcp` v0.5.0 installed at `D:\Quantcalc\venv\Scripts\analytics-mcp.exe`
- `.mcp.json` at project root, registering the server with Claude Code under the name `ga4`

## What you need to do (one-time, ~10 minutes)

### 1. Install the `gcloud` CLI (if you don't have it)

Download from <https://cloud.google.com/sdk/docs/install-sdk>. On Windows the easiest is the bundled installer (`GoogleCloudSDKInstaller.exe`). After install, restart your terminal.

Verify: `gcloud --version`

### 2. Enable the two required GA APIs on a Google Cloud project

You need a GCP project. If you don't have one, create one at <https://console.cloud.google.com/projectcreate> — name it anything (e.g. `quantoracle-analytics`). The project ID (auto-generated, looks like `quantoracle-analytics-12345`) is what you'll put in `.mcp.json` later.

Enable these two APIs on the project:

- [Google Analytics Admin API](https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com)
- [Google Analytics Data API](https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com)

Just click "Enable" on each page after selecting the right project from the dropdown.

### 3. Authenticate via Application Default Credentials

Run this command in any terminal:

```
gcloud auth application-default login --scopes https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform
```

A browser will open. Sign in with the Google account that has access to the **QuantOracle GA4 property (G-FPTTKC4T1N)**. After consent, the credentials are saved to a standard location (`%APPDATA%\gcloud\application_default_credentials.json`) — the MCP server finds them automatically.

### 4. Fill in your project ID in `.mcp.json`

Edit `D:\Quantcalc\.mcp.json` and replace `<YOUR_GCP_PROJECT_ID>` with the actual project ID from step 2 (e.g. `quantoracle-analytics-12345`).

### 5. Restart Claude Code

The `.mcp.json` is loaded when a session starts in this directory. After restart, you should see `mcp__ga4__*` tools available — `run_report`, `run_realtime_report`, etc.

## How to test it works

Once Claude has the tools loaded, try asking:

> "Use the ga4 MCP to list my Google Analytics properties and confirm you can see G-FPTTKC4T1N."

If Claude calls `get_account_summaries` and returns your property, setup is complete.

Then try:

> "What were the top 5 landing pages on quantoracle.dev in the last 7 days, sorted by sessions?"

Claude will call `run_report` with the right dimensions and metrics, and you'll get a real answer in 1-2 seconds.

## Useful prompts once it's running

- "Compare /writing/vercel-ai-sdk-quant-tools traffic against /writing/agentkit-reliable-quant-finance-math over the last 24 hours. Which is performing better and why?"
- "How many users hit /pricing yesterday? What % bounced vs clicked through to a calculator?"
- "Show me real-time active users right now, broken down by country."
- "Which calculator page has the highest engagement rate? That's the template to copy."
- "Plot the daily trend of `_meta.page` calculator-attributed API calls over the last 14 days."

## Troubleshooting

**"Could not load the default credentials"** — you skipped step 3. Re-run the `gcloud auth application-default login` command.

**"403 caller does not have permission"** — the Google account you used in step 3 doesn't have access to the GA4 property. Either use a different account or grant access via GA4 admin → Property access management → add your service account email.

**MCP server doesn't appear in tool list after restart** — verify `.mcp.json` is at the project root (`D:/Quantcalc/.mcp.json`, not in a subdirectory). Run `D:\Quantcalc\venv\Scripts\analytics-mcp.exe --help` in a terminal to confirm the binary works.

**"GOOGLE_PROJECT_ID is required"** — you forgot step 4. Fill in the actual project ID in `.mcp.json` and restart Claude.

## Rotating or revoking credentials later

To revoke: `gcloud auth application-default revoke`.

The credentials file at `%APPDATA%\gcloud\application_default_credentials.json` contains a refresh token — treat it like a password. It's `gitignored` (the whole `%APPDATA%` path is outside the repo anyway), but worth knowing.

## Cost

The Google Analytics Admin API and Data API are **free** for normal usage (well under any per-day quota you'd hit with a single agent). No GCP charges for using this MCP.
