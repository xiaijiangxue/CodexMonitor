---
date: 2026-05-24
topic: claude-code-integration
---

# Claude Code Integration in CodexMonitor

## Summary

Extend CodexMonitor with parallel Claude Code support — a sidecar process wrapping the Claude Agent SDK communicates via JSON-RPC over stdin/stdout, matching the existing Codex `app-server` protocol pattern, enabling conversation management, thread/history persistence, batch task execution, and file change monitoring for Claude Code workspaces.

---

## Problem Frame

CodexMonitor currently orchestrates Codex agents across local workspaces via the `codex app-server` JSON-RPC protocol. Users who want to run Claude Code must leave the app and work in a separate terminal, losing the unified workspace management, conversation history, diff preview, and file tree integration that CodexMonitor provides. The app has the UI shell, process management layer, and workspace model to support a second agent type — the missing piece is a Claude Code backend adapter with equivalent capability to the existing Codex integration. Adding this lets users choose the right agent for the task without switching tools.

---

## Actors

- A1. **User**: CodexMonitor user who creates and switches between Codex and Claude Code workspaces
- A2. **CodexMonitor App**: The Tauri frontend + Rust backend that manages workspace lifecycle and agent communication
- A3. **Claude Code Sidecar**: A TypeScript process compiled to a standalone binary via Bun `build --compile`, wrapping `@anthropic-ai/claude-agent-sdk`, spawned per workspace, communicating via JSON-RPC over stdin/stdout
- A4. **Claude Code CLI**: The `claude` binary on the user's PATH, spawned as a subprocess by the Sidecar

---

## Key Flows

- F1. **Create a Claude Code workspace**
  - **Trigger:** User creates a new workspace and selects "Claude Code" as agent type
  - **Actors:** A1, A2
  - **Steps:**
    1. User picks agent type (Codex / Claude Code) during workspace creation
    2. App saves workspace config with `agent_type: "claude"`
    3. UI shows appropriate Claude Code options (model, binary path)
  - **Outcome:** A Claude Code workspace is registered and appears in the workspace list
  - **Covered by:** R1, R2, R3

- F2. **Start a Claude Code conversation**
  - **Trigger:** User opens a Claude Code workspace and sends a message
  - **Actors:** A1, A2, A3, A4
  - **Steps:**
    1. App spawns the Sidecar process if not already running
    2. Sidecar initializes the Agent SDK (spawns `claude` subprocess)
    3. App sends a JSON-RPC `thread/start` request to the Sidecar
    4. Sidecar calls Agent SDK `query()` with the user's prompt
    5. Agent SDK streams response chunks back through Sidecar to the App
    6. App renders the streaming response in the conversation panel
  - **Outcome:** User sees the Claude Code response stream in real time
  - **Covered by:** R4, R5, R6

- F3. **Resume a previous Claude Code thread**
  - **Trigger:** User selects a historical thread from the thread list
  - **Actors:** A1, A2, A3
  - **Steps:**
    1. App requests thread/session restore via JSON-RPC
    2. Sidecar loads session from persisted Agent SDK session file (JSONL)
    3. Sidecar calls `query()` with session continuation
    4. User can continue the conversation from where it left off
  - **Outcome:** Previous conversation context is preserved and resumed
  - **Covered by:** R7

- F4. **View file changes from a Claude Code turn**
  - **Trigger:** Claude Code completes a tool call that modifies files (Edit, Write, Bash)
  - **Actors:** A2, A3
  - **Steps:**
    1. Sidecar intercepts `PostToolUse` events from the Agent SDK
    2. Sidecar forwards tool-use metadata (tool name, file path, content diff) as a JSON-RPC event
    3. App receives the event and updates the diff panel
    4. App shows the file changes alongside the conversation
  - **Outcome:** User sees file modifications in the diff panel immediately after they occur
  - **Covered by:** R8

- F5. **Execute a batch task with Claude Code**
  - **Trigger:** User submits a batch task request (e.g., "review all open PRs")
  - **Actors:** A1, A2, A3
  - **Steps:**
    1. User triggers a batch task from the UI
    2. App sends a task request via JSON-RPC
    3. Sidecar calls `query()` with structured prompt, configuring the SDK for structured JSON output
    4. Sidecar returns structured result
    5. App displays the result in a task-specific view
  - **Outcome:** User receives structured output from a non-interactive Claude Code run
  - **Covered by:** R9

---

## Requirements

**[Workspace model]**
- R1. Workspace config includes an `agent_type` field with values `"codex"` or `"claude"`, set at creation time and immutable thereafter. Existing workspaces without this field default to `agent_type: "codex"` on deserialization.
- R2. The workspace list UI displays a visual indicator (icon or badge) showing which agent type a workspace uses
- R3. `agent_type` filtering is supported in workspace list sort/group operations

**[Conversation engine]**
- R4. A Node.js/TypeScript Sidecar process wraps `@anthropic-ai/claude-agent-sdk`, providing a JSON-RPC interface over stdin/stdout matching the existing `codex app-server` protocol pattern
- R5. The Sidecar supports streaming responses — response chunks are forwarded as JSON-RPC notifications as they arrive from the Agent SDK
- R6. The Sidecar manages Agent SDK `query()` calls, mapping JSON-RPC request/response to prompt submission and result streaming

**[Threads and sessions]**
- R7. The Sidecar persists Agent SDK session state (JSONL) and supports session restore for thread continuation

**[File change monitoring]**
- R8. The Sidecar intercepts Agent SDK `PostToolUse` hooks for Edit, Write, and Bash tools, forwarding tool metadata as JSON-RPC events to the App for diff panel display

**[Batch tasks]**
- R9. The Sidecar supports a non-interactive `query()` mode for batch/submit-task requests, returning structured JSON results

**[Configuration]**
- R10. App settings include a `claude_bin` field (optional, defaults to resolving `claude` on PATH), parallel to the existing `codex_bin`
- R11. Workspace-level settings inherit the global `claude_bin` with optional per-workspace override

**[Sidecar lifecycle]**
- R12. The Sidecar process is spawned on first interaction with a Claude Code workspace and terminated when the workspace is closed or the app exits. An idle timeout mechanism (configurable, default 15 minutes) terminates Sidecars attached to open-but-inactive workspaces, with automatic restart on next interaction.
- R13. Sidecar startup is async — the UI shows a loading state while initialization completes, with a configurable timeout

---

## Acceptance Examples

- AE1. **Covers R1, R4, R5.** Given a new workspace with `agent_type: "claude"`, when the user sends a message "list all files in this project", the app spawns the Sidecar, initializes the Agent SDK, and streams the Claude Code response in the conversation panel within 15 seconds (cold start) or 5 seconds (warm start, Sidecar already cached).
- AE2. **Covers R7.** Given a Claude Code thread with 5 prior messages, when the user re-opens the thread after closing the workspace, the session is restored and the user sees the full conversation history.
- AE3. **Covers R8.** Given a running Claude Code conversation, when Claude executes a file edit (Edit tool), the diff panel updates with the file path and content change within 5 seconds of the tool call.
- AE4. **Covers R10.** Given a system where `claude` is not on PATH but is installed at `/custom/path/claude`, when the user sets `claude_bin` to that path in settings, the Sidecar resolves the correct binary.

---

## Success Criteria

- A user can complete a full Claude Code workflow (message → tool use → file change review → thread resume) entirely within CodexMonitor without opening a terminal
- Sidecar startup latency is under 5 seconds on a warm start (Sidecar process already cached)
- Sidecar startup latency is under 15 seconds on a cold start (no cached Sidecar process)
- Sidecar memory footprint is within 50 MB RSS when idle (no active conversation)
- File change events reach the diff panel within 5 seconds of the originating tool call

---

## Scope Boundaries

- The existing Codex integration is not modified or refactored — the two systems coexist independently
- No direct Claude API integration (all traffic goes through Agent SDK → Claude Code CLI)
- No MCP server management in CodexMonitor — Agent SDK handles MCP configuration automatically
- No Claude Code authentication flow — `claude` CLI is assumed to be authenticated
- No cross-agent thread migration in V1 (cannot convert a Codex thread to Claude Code or vice versa)
- No Claude Code-specific skill/plugin management in V1
- Sidecar is not packaged as a separate distributable — it ships as part of CodexMonitor

---

## Key Decisions

- **Sidecar language: TypeScript + Bun**: Agent SDK has first-class TypeScript support; Bun `build --compile` produces a single-file executable, eliminating the Node.js runtime dependency on the user's machine
- **Protocol: JSON-RPC over stdin/stdout**: Reuses the same IPC pattern as the existing `codex app-server`, allowing the Rust backend to share process management and message framing code
- **Independent workspace model**: A workspace is created as either Codex or Claude Code. Sharing a workspace between both agent types would add complexity without clear user value. On creation, the UI should warn the user that this choice is permanent and cannot be undone. Consider a workspace-cloning feature to allow future recreation with a different agent type without full data loss.
- **File change monitoring via SDK hooks**: Agent SDK's `PostToolUse` hook provides real-time tool execution events, which is cleaner than polling or log parsing

---

## Dependencies / Assumptions

- `@anthropic-ai/claude-agent-sdk` TypeScript package is available on npm and compatible with the target platform architecture
- Bun `build --compile` successfully produces a cross-platform single-file binary for macOS (x64 + arm64), Windows (x64), and Linux (x64). Bun must be added to CI/CD build inputs and `flake.nix` as a native build dependency.
- The Agent SDK's `PostToolUse` hook exposes sufficient metadata (tool name, file path, content) to reconstruct file diffs
- Agent SDK session persistence (JSONL) is sufficient for thread continuation — no additional database or storage layer is needed for V1
- Claude Code CLI is installed and authenticated on the user's machine (same assumption as `codex` binary availability)
- Agent SDK `query()` supports concurrent calls or a reasonable queuing mechanism (invesitgate during planning)

---

## Outstanding Questions

### Resolve Before Planning

- [Affects R4, R5, R6, R7, R8, R9] [Validation] Verify Agent SDK API surface before committing to architecture: does `query()` exist with expected streaming signature? Does the SDK expose `PostToolUse` hooks with file content metadata?

### Deferred to Planning

- [Affects R4] [Needs research] What is the minimum Bun version required for `build --compile`? Should we bundle the Bun runtime or compile as a standalone binary?
- [Affects R8] [Technical] Does the Agent SDK's `PostToolUse` hook provide the full file content after edit, or just a diff/notification? Verify during planning.
- [Affects R5] [Technical] What is the exact message framing format for JSON-RPC streaming over stdin/stdout? Design during planning to match existing `codex app-server` format.
- [Affects R12] [Technical] Does the Agent SDK support graceful shutdown, and what cleanup does the Sidecar need on termination?

### From 2026-05-24 Document Review — Needs Resolution Before Implementation

- [Affects R4] [Architecture] Sidecar binary build integration: how to integrate `bun build --compile` into `npm run tauri:build` — `tauri.conf.json` `externalBin` config, `build.rs` pre-build step, `flake.nix` Bun input.
- [Affects R4, R5, R6] [Architecture] JSON-RPC method contract: does the Sidecar implement the same methods as `codex app-server`, parallel methods with a `claude/` prefix, or does the frontend route by `agent_type`? Design the full method surface before implementation.
- [Affects R9] [Scope] Is the batch query mode (R9) needed for V1, or can it be deferred? No acceptance example or success criterion depends on it.
- [Affects R8] [Design] PostToolUse hook integration with existing git-based diff panel — does the hook feed into the existing `turn/diff/updated` event path, or follow a new path? Deduplication strategy needed.
- [Affects R12, R13] [Design] Sidecar lifecycle error recovery: crash detection, auto-restart with session restore, user-visible error state, timeout behavior. Define error taxonomy and UI for each failure mode.
- [Affects R4] [Validation] Verify Agent SDK API surface: does `query()` exist with expected streaming signature? Does the SDK expose `PostToolUse` hooks with file content metadata? Test against actual SDK before committing to architecture.
- [Affects R4] [Research] Does Bun `build --compile` produce working binaries on all target platforms (macOS x64+arm64, Windows x64, Linux x64)? Document any platform gaps and fallback strategy.
- [Affects All] [Strategy] Assess ongoing maintenance burden of dual backends (Rust + TypeScript) for a small team. Expected time per release, personnel requirements, surface area growth.
- [Affects All] [Strategy] Evaluate integrated terminal pane as a lighter alternative that delivers core value ("stay in CodexMonitor") without full Sidecar architecture. Document rejection rationale.
- [Affects R2, R8] [Design] Information architecture: specify layout relationship of workspace list, visual indicator, conversation panel, diff panel, and task-specific view.
- [Affects All Interactions] [Design] Define interaction states (loading, empty, error, partial, success) for every user-visible behavior beyond the single loading state in R13.
- [Affects R2] [Design] Specify visual indicator for agent_type: icon identity, placement, size, and color (avoiding color-only WCAG failure).
- [Affects R2, R3, F4] [Accessibility] Specify keyboard navigation, screen reader support, and touch targets for streaming content, diff panel, and filter controls.
- [Affects Success Criteria] [Scope] Add success criteria for: crash recovery time, error rate per session, conversation data integrity, and user task-completion time vs. terminal baseline.
