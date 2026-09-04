# Deployment and automation

## GitHub Actions

The workflow needs:

- scheduled and manual triggers;
- Node.js compatible with `package.json`;
- `permissions: contents: write`;
- one concurrency group without canceling an in-progress data write;
- secret-to-environment mapping without printing values;
- change detection limited to generated data;
- commit, rebase, and push to the triggering production branch.

GitHub cron uses UTC. Convert from the user's timezone explicitly and document both local and UTC times. Scheduled workflows run from the default branch; a workflow merged only into a feature branch is not active for production scheduling.

## Secrets

The reference pipeline does not require an LLM API. `JUSTONE_API_TOKEN` is optional for a Xiaohongshu source. Add tokens through repository Actions secrets. Never ask the user to paste a real token into chat when they can enter it directly in GitHub.

An internal-only hostname such as `*.local` normally cannot be resolved by GitHub-hosted runners. Use a public gateway or a self-hosted runner on the required network; ping alone does not make an internal API reachable.

## Hosting

- For Netlify, connect the GitHub repository, select the production branch, and use the checked-in `netlify.toml` unless the project already has authoritative settings.
- For Vercel, connect the same production branch and verify the production deployment, not merely the pull-request preview.
- Do not configure two providers as if both were the canonical production site. Identify the user's official URL.

## Verification checkpoints

1. Workflow exists on the default branch.
2. Scheduled/manual run completes.
3. Generated files have a new timestamp and valid schema.
4. Bot commit appears on the production branch.
5. Hosting deployment references that commit and is Ready/Published.
6. Official URL renders the expected version and current data.
7. Browser/network console has no JSON 404 or parse errors.

A green PR preview proves only that preview. A green Action proves only the workflow. A successful deployment proves only that files were published. Confirm the rendered content date before saying the radar updated.

