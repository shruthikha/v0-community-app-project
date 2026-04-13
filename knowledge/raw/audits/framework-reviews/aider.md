---
framework: Aider
source: github.com/paul-gauthier/aider
relevance_score: 4
extracted_patterns:
  - CLI-based AI pair programming
  - Git-native workflow (auto-commits)
  - In-place code editing
  - Voice mode for hands-free coding
  - Best practices for AI pair programming
  - Multi-file context management
skills_to_port:
  - cli-pair-programming
  - git-workflow
  - context-management
workflows_to_adapt:
  - /implement (CLI workflow patterns)
  - /ship (git workflow integration)
anti_patterns:
  - Installation/setup specifics (not relevant)
  - Desktop app features (we use OpenCode)
customizations_needed:
  - Extract workflow patterns, not tool configuration
  - Adapt to OpenCode's tooling
---

# Aider Framework Deep Dive

## Overview

**Repository:** github.com/paul-gauthier/aider  
**Creator:** Paul Gauthier  
**Stars:** 36,000+ ⭐  
**Created:** 2023 | **Primary Language:** Python

Aider is a **command-line AI pair programming tool** that connects to LLMs like Claude, GPT-4, and Gemini to edit code directly in a local git repository.

## Key Features

### CLI-Based Pair Programming

Aider runs entirely in the terminal:
- Chat with AI while it edits your code
- AI proposes changes, you approve or modify
- Supports multiple LLMs (Claude, GPT, Gemini, etc.)

### Git-Native Workflow

Aider is deeply integrated with git:
- **Auto-commits** after every AI edit
- **Atomic changes** — each edit is a commit
- **Git diff** visible in chat
- **Branch support** for experiments

### In-Place Editing

- AI edits files directly in your codebase
- No copy-paste workflow
- Maintains code quality and formatting

### Voice Mode

- Hands-free coding via voice commands
- For rapid prototyping and exploration

### Multi-File Context

- Add multiple files to AI's context
- AI understands relationships between files
- Better for refactoring and large changes

## Best Practices from Aider

### 1. Add Files Explicitly

```bash
aider file1.py file2.py
```

Don't add entire codebase — add only files that need changes. This keeps context focused.

### 2. Use Single Responsibility

Aider works best when:
- One task at a time
- Clear, bounded changes
- Frequent check-ins

### 3. Trust but Verify

- AI makes good decisions most of time
- Review before committing
- Use git to rollback if needed

### 4. Pair Programming Mentality

- Think out loud with AI
- Explain why, not just what
- AI learns your preferences over time

## Relevance to Nido+Río Migration

### What to Extract (High Priority)

1. **CLI pair programming workflow** — Terminal-centric, explicit file selection
2. **Git-native auto-commit** — Every change is versioned
3. **Explicit context management** — Add only what's needed
4. **Single responsibility pattern** — One task at a time

### What to Skip

- **Installation/configuration** — Not relevant for our research
- **Desktop app features** — We use OpenCode
- **Voice mode** — Not part of our workflow

### Customization for OpenCode

- Map CLI patterns → OpenCode command workflows
- Git integration → Already handled by Git MCP
- Context management → Already handled by OpenCode's context window

### Scoring

| Criterion | Score | Notes |
|-----------|-------|-------|
| Workflow discipline | 4/5 | Solid pair programming patterns |
| Skill portability | 4/5 | Workflow ideas adapt well |
| Multi-agent coordination | 2/5 | Single-agent focus |
| **Overall** | **3.5/5** | **Useful workflow reference** |

## Files to Reference

- Create `.opencode/skills/cli-pair-programming/SKILL.md` (conceptual, not Aider-specific)
- Extract patterns for `/implement` workflow
