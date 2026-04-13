Agent skills let OpenCode discover reusable instructions from your repo or home directory. Skills are loaded on-demand via the native skill tool—agents see available skills and can load the full content when needed.
Place Files
Create one folder per skill name and put a SKILL.md inside it. OpenCode searches these locations:

Project config: .opencode/skills/&lt;name&gt;/SKILL.md
Global config: ~/.config/opencode/skills/&lt;name&gt;/SKILL.md
Project Claude-compatible: .claude/skills/&lt;name&gt;/SKILL.md
Global Claude-compatible: ~/.claude/skills/&lt;name&gt;/SKILL.md
Project agent-compatible: .agents/skills/&lt;name&gt;/SKILL.md
Global agent-compatible: ~/.agents/skills/&lt;name&gt;/SKILL.md

Understand Discovery
For project-local paths, OpenCode walks up from your current working directory until it reaches the git worktree. It loads any matching skills/*/SKILL.md in .opencode/ and any matching .claude/skills/*/SKILL.md or .agents/skills/*/SKILL.md along the way.
Global definitions are also loaded from ~/.config/opencode/skills/*/SKILL.md, ~/.claude/skills/*/SKILL.md, and ~/.agents/skills/*/SKILL.md.
Write Frontmatter
Each SKILL.md must start with YAML frontmatter. Only these fields are recognized:

name (required)
description (required)
license (optional)
compatibility (optional)
metadata (optional, string-to-string map)

Unknown frontmatter fields are ignored.
Validate Names
name must:

Be 1–64 characters
Be lowercase alphanumeric with single hyphen separators
Not start or end with -
Not contain consecutive --
Match the directory name that contains SKILL.md

Equivalent regex:
^[a-z0-9]+(-[a-z0-9]+)*$
Follow Length Rules
description must be 1-1024 characters. Keep it specific enough for the agent to choose correctly.
Use an Example
Create .opencode/skills/git-release/SKILL.md like this:
---
name: git-release
description: Create consistent releases and changelogs
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
---
 
## What I do
 
- Draft release notes from merged PRs
- Propose a version bump
- Provide a copy-pasteable `gh release create` command
 
## When to use me
 
Use this when you are preparing a tagged release.
Ask clarifying questions if the target versioning scheme is unclear.
Recognize Tool Description
OpenCode lists available skills in the skill tool description. Each entry includes the skill name and description:
&lt;available_skills&gt;
&lt;skill&gt;
  &lt;name&gt;git-release&lt;/name&gt;
  &lt;description&gt;Create consistent releases and changelogs&lt;/description&gt;
&lt;/skill&gt;
&lt;/available_skills&gt;
The agent loads a skill by calling the tool:
skill({ name: "git-release" })
Configure Permissions
Control which skills agents can access using pattern-based permissions in opencode.json:
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
PermissionBehaviorallowSkill loads immediatelydenySkill hidden from agent, access rejectedaskUser prompted for approval before loading
Patterns support wildcards: internal-* matches internal-docs, internal-tools, etc.
Override Per Agent
Give specific agents different permissions than the global defaults.
For custom agents (in agent frontmatter):
---
permission:
  skill:
    "documents-*": "allow"
---
For built-in agents (in opencode.json):
{
  "agent": {
    "plan": {
      "permission": {
        "skill": {
          "internal-*": "allow"
        }
      }
    }
  }
}
Disable the Skill Tool
Completely disable skills for agents that shouldn't use them:
For custom agents:
---
tools:
  skill: false
---
For built-in agents:
{
  "agent": {
    "plan": {
      "tools": {
        "skill": false
      }
    }
  }
}
When disabled, the &lt;available_skills&gt; section is omitted entirely.
Troubleshoot Loading
If a skill does not show up:

Verify SKILL.md is spelled in all caps
Check that frontmatter includes name and description
Ensure skill names are unique across all locations
Check permissions—skills with deny are hidden from agents
ACP SupportCustom ToolsLightPrivacy PolicyAbout UsContact2026 © OpenCode Documentation | Unofficial, for reference only{"props":{"pageProps":{}},"page":"/en/docs/skills","query":{},"buildId":"po70v7Ev6IrFY6Ww-EB40","nextExport":true,"autoExport":true,"isFallback":false,"scriptLoader":[]}
