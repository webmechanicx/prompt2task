# prompt2task

Local-first CLI that turns natural-language prompts into structured tasks, sends them to AI providers (OpenAI, Claude), and stores history locally in SQLite.

[Visit Website](https://prompt2task.dev)

## What it does

1. Reads your configuration (`~/.prompt2task/config.json`)
2. Detects current project context (React, Laravel, WordPress, etc.)
3. Converts raw prompt into a structured coding task
4. Saves task to local SQLite (`~/.prompt2task/history.db`)
5. Sends task to selected AI provider
6. Displays response and saves result + metadata

**Local-first:** No remote backend, telemetry, or account system. Secrets prefer OS env vars / secure file with `0600`.

## Installation

```bash
npm install prompt2task -g
```

Or run directly:

```bash
npx prompt2task --help
```

## First-time setup

```bash
prompt2task init
```

Interactive flow:
- Select provider (OpenAI / Claude)
- Enter API key (stored in `~/.prompt2task/credentials.json` with `0600`, or use env vars)
- Select default model
- Select primary project type

Re-run `prompt2task init` to reconfigure (will prompt before overwriting).

## Usage

### Run a task

```bash
prompt2task "Build a responsive login page with Google OAuth"
prompt2task "Build a React dashboard"
```

With JSON output for automation:

```bash
prompt2task --json "Create a REST API for users"
```

### History

```bash
prompt2task list
prompt2task list --limit 20
prompt2task list --status completed
prompt2task list --json

prompt2task show tsk_8f29a
prompt2task show tsk_8f29a --json

prompt2task search "authentication"
prompt2task search "authentication" --json
```

### Configuration

```bash
prompt2task config
prompt2task config set model gpt-5
prompt2task config set project-type react
prompt2task config set provider openai
```

### Provider & Credentials

```bash
prompt2task provider
prompt2task credentials remove openai
prompt2task credentials remove claude
prompt2task credentials remove all
```

Environment variables (used as fallback, not persisted):

```bash
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
```

## Global files

```
~/.prompt2task/
├── config.json
├── credentials.json   # 0600, not in DB
├── history.db
└── logs/
```

Example `config.json`:

```json
{
  "version": 1,
  "provider": "openai",
  "model": "gpt-5",
  "projectType": "web-applications"
}
```

## Security notes

- API keys never enter task history, logs, or error messages
- Never committed to git (see `.gitignore`)
- `config.json` and `credentials.json` are `0600`, app dir `0700`
- Prefer env vars in CI; file store is fallback with restrictive perms
- HTTPS only for provider calls

## Development

```bash
npm run build      # tsup build to dist/
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run dev        # watch mode
```

## Architecture

```
src/
├── cli/           # commander + inquirer + chalk + ora + cli-table3
├── providers/     # provider abstraction (openai, claude)
├── tasks/         # task model, manager, prompt-builder
├── storage/       # drizzle-orm + better-sqlite3, migrations, repositories
├── config/        # config-manager (zod) + credentials
└── project/       # detector (package.json, composer.json, artisan, wp-config)
```

## Testing

Provider calls are mocked; no real API keys needed.

```bash
npm test
```

## Example workflows

```bash
npm install && npm run build && npm link

prompt2task init

prompt2task "Build a responsive React dashboard"
prompt2task list
prompt2task show <task-id>
prompt2task search "dashboard"
prompt2task --json "Fix WordPress menu" | jq .
```
