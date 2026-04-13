# OpenCode Reference

OpenCode is configured through `opencode.json` and project-local `.opencode/` files.

## Agents

- Agents come in two types: `primary` and `subagent`.
- Built-in primary agents are `build` and `plan`.
- Built-in subagents are `general` and `explore`.
- Primary agents are the main session agents; subagents are specialized helpers invoked by primary agents or `@` mentions.
- Agents can be configured in JSON under `agent` or as markdown files under `.opencode/agents/`.
- Useful agent fields: `description`, `mode`, `model`, `prompt`, `tools`, `permission`, `temperature`, `steps`, `hidden`, `color`, `top_p`.
- `mode` can be `primary`, `subagent`, or `all`.
- `steps` limits agentic iterations.
- `hidden: true` hides a subagent from autocomplete.
- `permission.task` controls which subagents can be invoked by an agent.

## Commands

- Custom commands live in `.opencode/commands/` or in `opencode.json` under `command`.
- Command files are markdown with YAML frontmatter.
- Required command fields: `description`.
- Optional command fields: `agent`, `model`, `subtask`.
- Command bodies are templates.
- Use `$ARGUMENTS` for the full argument string, or `$1`, `$2`, etc. for positional args.
- Use `!\`command\`` to inject shell output and `@file` to include file contents.
- A command can run as a subtask if `subtask: true`.

## Skills

- Skills live in `.opencode/skills/<name>/SKILL.md`.
- A skill folder must contain `SKILL.md`.
- Skill frontmatter fields: `name` and `description` are required; `license`, `compatibility`, and `metadata` are optional.
- Skill names must be lowercase, hyphenated, and match the folder name.
- Skills are loaded on-demand via the `skill` tool.
- Use `permission.skill` to allow, deny, or ask for skill loading.
- `tools.skill: false` disables skills entirely for an agent.

## Permissions

- Main permission actions are `allow`, `ask`, and `deny`.
- Common permission keys include `read`, `edit`, `glob`, `grep`, `list`, `bash`, `task`, `skill`, `webfetch`, `websearch`, `external_directory`.
- `read` defaults to `allow`; `.env` files should usually be denied.
- Use glob patterns for granular control.
- Last matching rule wins.
- Permissions can be overridden globally and per agent.
- `bash` permissions are where most workflow safety lives.

## MCP Servers

- MCP servers are configured under `mcp` in `opencode.json`.
- Local servers use `type: "local"` and a `command`.
- Remote servers use `type: "remote"` and a `url`.
- Use `environment` for local server env vars.
- Use `headers` for remote auth headers.
- OpenCode supports OAuth for remote MCPs.
- Keep MCPs minimal because they add context overhead.

## Config

- `opencode.json` supports JSON and JSONC.
- Project config lives at repo root.
- Config includes `model`, `provider`, `permission`, `agent`, `command`, `mcp`, `instructions`, `share`, and more.
- `plan` is the default analysis-focused primary agent.
- `build` is the default development primary agent.
- Project config can be layered with global config.

## Workflow Notes

- Use `plan` for analysis and suggestion-heavy work.
- Use `build` when you need direct implementation and file operations.
- Use `general` for multi-step research and `explore` for read-only code discovery.
- Keep command and agent definitions in the project, not chat history.
