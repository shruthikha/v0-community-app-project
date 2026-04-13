---
framework: Claude Code
source: anthropic.com/claude-code
relevance_score: 5
extracted_patterns:
  - Native plugin system (/plugin commands)
  - Skills system (CLAUDE.md, .claude/skills/)
  - MCP server configuration
  - Agent mode for autonomous tasks
  - Hooks system (session start, pre-commit, etc.)
  - Slash commands
  - /claude command-line interface
skills_to_port:
  - plugin-system
  - skills-system
  - mcp-configuration
  - hooks-system
  - agent-mode
workflows_to_adapt:
  - All workflows (plugin/hook integration)
  - /implement (agent mode patterns)
anti_patterns:
  - Browser automation (not needed with MCP)
  - Desktop-specific features
customizations_needed:
  - Map to OpenCode equivalents
  - Extract workflow patterns, not tool-specific features
---

# Claude Code Framework Deep Dive

## Overview

**Creator:** Anthropic  
**Platform:** macOS, Linux, Windows  
**Key Innovation:** First-class AI coding assistant with native extensibility

Claude Code is a **first-class AI coding assistant** with native extensibility through plugins, skills, and MCP servers.

## Native Extensibility

### Plugin System

Claude Code has a rich plugin ecosystem:

```bash
/plugin marketplace add <plugin>
/plugin install <plugin>
/plugin list
/plugin remove <plugin>
```

**Superpowers Marketplace Example:**
```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

### Skills System

Skills are markdown files that define agent behavior:

**CLAUDE.md** — Project-level instructions
```
# Project Name
This is a Next.js app with Supabase backend.
- Run `npm run dev` to start
- Tests in `__tests__/`
```

**.claude/skills/** — Directory of skill files
```
.claude/
├── skills/
│   ├── debugging/
│   │   └── SKILL.md
│   ├── code-review/
│   │   └── SKILL.md
│   └── writing/
│       └── SKILL.md
```

**SKILL.md Format:**
```markdown
---
name: debugging
description: Systematic debugging approach
---

# Debugging Skill

## When to use
- Any bug investigation
- Error analysis

## Approach
1. Gather error messages
2. Identify reproduction steps
3. Isolate the problem
4. Form hypothesis
5. Test and verify
```

### MCP Server Configuration

Claude Code has built-in MCP support:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

### Hooks System

Session hooks for automation:

- **On start:** Load project context
- **On edit:** Lint/typecheck
- **On commit:** Pre-commit checks
- **On message:** Custom handlers

### Agent Mode

Claude Code can run in **agent mode** for autonomous tasks:

```bash
/claude --agent "Refactor the auth system"
```

Features:
- Autonomous task completion
- Multi-step planning
- Self-correction

## Relevance to Nido+Río Migration

### What to Extract (High Priority)

1. **Skills system** — SKILL.md format directly maps to OpenCode
2. **Plugin architecture** — OpenCode uses similar approach
3. **MCP configuration** — We already use this (opencode.json)
4. **Hooks system** — Could inspire workflow automation
5. **CLAUDE.md pattern** — Maps to AGENTS.md

### What to Skip

- **Browser automation** — Not needed (we use MCP)
- **Desktop-specific features** — We're CLI-focused
- **Installation/configuration** — Not relevant

### Customization for OpenCode

- Skills format → Already OpenCode-native
- MCP config → Already configured in opencode.json
- Hooks → Could be workflow automation in Phase 6

### Scoring

| Criterion | Score | Notes |
|-----------|-------|-------|
| Workflow discipline | 4/5 | Skills enforce behavior |
| Skill portability | 5/5 | Direct mapping to OpenCode |
| Multi-agent coordination | 3/5 | Agent mode exists |
| **Overall** | **4/5** | **Reference implementation** |

## Files to Reference

- Map `.claude/skills/` → `.opencode/skills/`
- Map CLAUDE.md → AGENTS.md (already done)
- Extract hooks for workflow automation
