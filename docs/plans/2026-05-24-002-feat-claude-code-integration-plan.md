---
title: Claude Code Integration in CodexMonitor — Implementation Plan
type: feat
status: active
date: 2026-05-24
origin: docs/brainstorms/claude-code-integration-requirements.md
---

# Claude Code Integration — Implementation Plan

## Summary

Add parallel Claude Code agent support to CodexMonitor by creating a TypeScript Sidecar process wrapping the Claude Agent SDK, communicating with the existing Rust backend via JSON-RPC over stdin/stdout. The Sidecar is compiled to a standalone binary via Bun `build --compile` and bundled via Tauri `externalBin`. Workspaces gain an `agent_type` field to distinguish Codex vs. Claude Code sessions. No existing Codex integration code is modified.

---

## Problem Frame

CodexMonitor currently orchestrates Codex agents across local workspaces. Users who want to use Claude Code must leave the app and work in a separate terminal, losing workspace management, conversation history, diff preview, and file tree integration. The solution is a parallel integration that matches the existing Codex protocol pattern without modifying existing code.

---

## Requirements

**[Workspace model]**
- R1. Workspace config includes an `agent_type` field (`"codex"` or `"claude"`), immutable after creation. Existing workspaces default to `"codex"`.
- R2. Workspace list UI displays a visual indicator for agent type.
- R3. Agent type filtering in workspace list sort/group.

**[Conversation engine]**
- R4. TypeScript Sidecar wraps `@anthropic-ai/claude-agent-sdk` with JSON-RPC over stdin/stdout.
- R5. Sidecar supports streaming responses as JSON-RPC notifications.
- R6. Sidecar maps JSON-RPC request/response to SDK `query()` calls.

**[Threads and sessions]**
- R7. Sidecar persists Agent SDK sessions (built-in JSONL) for thread continuation.

**[File change monitoring]**
- R8. Sidecar intercepts `PostToolUse` hooks for Edit/Write/Bash, forwarding to diff panel.

**[Batch tasks]**
- R9. (Deferred to post-V1) Batch/non-interactive query mode.

**[Configuration]**
- R10. App settings include `claude_bin` field (optional, defaults to PATH).
- R11. Workspace-level override for `claude_bin`.

**[Sidecar lifecycle]**
- R12. Sidecar spawned on first interaction, idle timeout (default 15 min), terminated on workspace close or app exit.
- R13. Async startup with loading state and configurable timeout.

**Origin actors:** A1 (User), A2 (CodexMonitor App), A3 (Claude Code Sidecar), A4 (Claude Code CLI)
**Origin flows:** F1 (Create workspace), F2 (Start conversation), F3 (Resume thread), F4 (View file changes), F5 (Batch task — deferred)
**Origin acceptance examples:** AE1 (cold/warm startup), AE2 (thread resume), AE3 (file change diff), AE4 (claude_bin config)

---

## Scope Boundaries

- Existing Codex integration is NOT modified — two systems coexist independently
- No direct Claude API integration (all traffic goes through Agent SDK → Claude Code CLI)
- No MCP server management in CodexMonitor (Agent SDK handles this)
- No Claude Code authentication flow in CodexMonitor
- No cross-agent thread migration in V1
- No Claude Code skill/plugin management in V1
- R9 batch query mode deferred to post-V1

---

## Context & Research

### Key Architecture Pattern

The existing Codex integration uses this flow:
```
User action → invoke("codex::command") → codex::handler()
  → session.send_request("method", params)
    → JSON-RPC line on stdin of codex process
  → streamed events via "app-server-event" Tauri event
```

The Claude Code Sidecar follows the same pattern with a parallel set of files and a new Tauri event channel `"claude-app-server-event"`.

### Agent SDK API Surface (Verified)

- `query()` — exists, async generator returning `SDKMessage` objects
- `startup()` — exists, pre-warms CLI subprocess for warm-start optimization
- `PostToolUse` hook — exists, fires after tool execution with tool name and result metadata
- Session persistence — built-in, automatic JSONL on disk, resume/fork/continue support
- Bun `build --compile` — supported, requires `extractFromBunfs()` helper for compiled binary
- `pathToClaudeCodeExecutable` option — for specifying `claude` binary path at runtime

### External References

- [Agent SDK TypeScript docs](https://code.claude.com/docs/en/agent-sdk/typescript)
- [Agent SDK hooks](https://code.claude.com/docs/en/agent-sdk/hooks)
- [Agent SDK sessions](https://code.claude.com/docs/en/agent-sdk/sessions)

---

## Key Technical Decisions

- **Sidecar runtime: TypeScript + Bun compile**: Agent SDK has first-class TS support; Bun `build --compile` produces standalone binary; `extractFromBunfs()` handles the platform binary embedding at runtime for compiled executables.
- **Protocol: JSON-RPC over stdin/stdout**: Same IPC pattern as existing `codex app-server`; Rust `process_core::tokio_command()` and `kill_child_process_tree()` are reusable.
- **JSON-RPC method namespace: `claude/` prefix**: Clear separation from existing `codex/` methods. The Sidecar implements `claude/start`, `claude/query`, `claude/stop`, `claude/thread/list`, `claude/thread/resume`, `claude/toolEvent`.
- **Event channel: Separate `"claude-app-server-event"` Tauri event**: Avoids touching the existing event pipeline. New events.ts Claude hub, new appServerEvents.ts Claude filter.
- **Session model: One sidecar per workspace**: Unlike Codex (shared session), each Claude workspace gets its own Sidecar process. Idle timeout (R12) manages resource scaling.
- **Agent SDK warm-start via `startup()`**: Sidecar calls `startup()` on spawn; first `query()` call reuses the pre-warmed CLI subprocess for sub-5s warm latency.
- **R9 deferred to post-V1**: No acceptance example or success criterion requires batch mode. Removing it from V1 scope reduces protocol surface and risk.
- **Diff integration via PostToolUse hook events**: Sidecar forwards tool name + file path + content as JSON-RPC event; frontend receives it on the Claude event hub and renders through existing diff components with a new `source` discriminator.

---

## Implementation Units

- U1. **[Workspace Model — Add agent_type field]**

**Goal:** Add `agent_type` to workspace data model with backward-compatible migration

**Requirements:** R1

**Dependencies:** None

**Files:**
- Modify: `src-tauri/src/types.rs`
- Modify: `src-tauri/src/shared/workspaces_core/crud_persistence.rs`
- Modify: `src-tauri/src/shared/workspaces_core/connect.rs`

**Approach:**
- Add `agent_type: AgentType` enum (`Codex`, `Claude`) with `#[serde(default)]` on `WorkspaceEntry` so existing records deserialize as `Codex`
- Add to `WorkspaceSettings` and any UI-facing types
- Guard existing Codex-specific paths (workspace connection, session spawn) behind `agent_type == Codex`
- New workspace creation flow accepts `agent_type` parameter

**Test scenarios:**
- Happy path: Create a new workspace with `agent_type: "claude"` → stored correctly
- Migration: Deserialize an old `workspaces.json` with no `agent_type` → defaults to `Codex`
- Immutability: Attempt to change `agent_type` after creation → rejected
- Error: Pass invalid `agent_type` value → deserialization error

**Verification:**
- Existing unit tests pass without modification
- Old workspace files load without error
- Database/JSON migration does not crash

---

- U2. **[Sidecar TypeScript Code]**

**Goal:** Implement the TypeScript Sidecar process that wraps the Agent SDK with JSON-RPC over stdin/stdout

**Requirements:** R4, R5, R6, R7, R8

**Dependencies:** U1 (workspace model), Agent SDK verified

**Files:**
- Create: `src-tauri/sidecar/package.json`
- Create: `src-tauri/sidecar/tsconfig.json`
- Create: `src-tauri/sidecar/src/index.ts` (entry point — JSON-RPC loop)
- Create: `src-tauri/sidecar/src/protocol.ts` (JSON-RPC request/response types)
- Create: `src-tauri/sidecar/src/agent.ts` (Agent SDK wrapper — query, startup, hooks)
- Create: `src-tauri/sidecar/src/session.ts` (session management)
- Create: `src-tauri/sidecar/src/types.ts` (shared types)

**Approach:**
- Read JSON-RPC requests line-by-line from stdin (newline-delimited JSON)
- Request types:
  - `{"id": N, "method": "claude/start", "params": {"prompt": string, "options": {...}}}`
  - `{"id": N, "method": "claude/query", "params": {"prompt": string, "sessionId": string|null}}`
  - `{"id": N, "method": "claude/stop", "params": {}}`
  - `{"id": N, "method": "claude/thread/list", "params": {}}`
  - `{"id": N, "method": "claude/thread/resume", "params": {"sessionId": string}}`
  - `{"id": N, "method": "claude/ping", "params": {}}`
- Response types:
  - Streaming chunks: `{"method": "claude/responseDelta", "params": {"delta": string, "sessionId": string}}`
  - Tool events: `{"method": "claude/toolEvent", "params": {"tool": string, "filePath": string|null, "content": any, "sessionId": string}}`
  - Completion: `{"id": N, "result": {"sessionId": string, "messages": SDKMessage[]}}`
  - Error: `{"id": N, "error": {"message": string}}`
- On spawn, initialize SDK with `startup()` for warm-start
- Register `PostToolUse` hook matching `Edit|Write|Bash` tools → emit `claude/toolEvent`
- Use `options.pathToClaudeCodeExecutable` for custom `claude_bin`
- Pass `options.persistSession: true` and `options.continue: true` for automatic session tracking
- On `claude/stop`, call the SDK's abort mechanism, then flush and exit

**Patterns to follow:**
- Agent SDK TypeScript reference (see External References)
- Existing Codex session structure in `app_server.rs`

**Test scenarios:**
- Happy path: Send `claude/start` with prompt → receive streaming `responseDelta` events → receive completion
- Edge case: Receive unknown method → respond with error `{"id": N, "error": {"message": "unknown method"}}`
- Edge case: Stdin pipe closes → graceful shutdown
- Edge case: Multiple concurrent requests → queue or reject as appropriate
- Error: SDK initialization fails → respond with error on first request
- Hook: Edit tool fires PostToolUse → `claude/toolEvent` emitted with file path and content

**Verification:**
- Sidecar executable starts, reads stdin, and accepts JSON-RPC requests
- Response to `claude/ping` returns within 500ms
- Streaming responses arrive as newline-delimited JSON

---

- U3. **[Build Integration — Bun compile + Tauri bundle]**

**Goal:** Integrate Sidecar build into the Tauri build pipeline

**Requirements:** R4, R10, R12

**Dependencies:** U2 (sidecar code exists)

**Files:**
- Modify: `src-tauri/tauri.conf.json` (add `bundle.externalBin`)
- Modify: `flake.nix` (add `pkgs.bun` to buildInputs)
- Modify: `package.json` (add sidecar build script)
- Modify: `src-tauri/build.rs` (add sidecar build step to existing tauri_build::build())
- Create: `src-tauri/binaries/` (directory for sidecar binaries per platform)

**Approach:**
- Add `"bundle": {"externalBin": ["binaries/claude-sidecar"]}` to `tauri.conf.json`
- Add build step to compile Sidecar before Tauri build:
  - `cd src-tauri/sidecar && bun install && bun build --compile --target=bun-darwin-arm64 ./src/index.ts --outfile ../binaries/claude-sidecar`
  - Resulting binary at `src-tauri/binaries/claude-sidecar-aarch64-apple-darwin` (Tauri expects target-triple suffix)
- Add CI/CD pipeline step for each target platform (macOS x64+arm64, Windows x64, Linux x64)
- Update `flake.nix` with `pkgs.bun` in `nativeBuildInputs`
- The `build.rs` script checks if sidecar binary exists and rebuilds if source changed

**Test scenarios:**
- `npm run tauri:build` succeeds with sidecar binary bundled
- `npm run tauri:dev` resolves the sidecar binary path correctly
- Platform-specific binary naming follows Tauri conventions

**Verification:**
- `tauri build` produces a distributable with embedded sidecar binary
- Dev mode finds and spawns the sidecar from the expected path
- Binary runs standalone: `./claude-sidecar` starts and reads stdin

---

- U4. **[Rust ClaudeSession — Spawn and Manage Sidecar]**

**Goal:** Create the Rust-side Sidecar process management, mirroring WorkspaceSession

**Requirements:** R4, R5, R6, R12, R13

**Dependencies:** U3 (sidecar binary exists in build chain)

**Files:**
- Create: `src-tauri/src/backend/claude_session.rs`
- Create: `src-tauri/src/shared/claude_core.rs`
- Modify: `src-tauri/src/state.rs` (register session map)

**Approach:**
- Create `ClaudeSession` struct with:
  - `Child` (sidecar process handle)
  - `ChildStdin` (wrapped in `tokio::io::BufWriter`)
  - `pending: HashMap<u64, oneshot::Sender<Value>>`
  - `next_id: AtomicU64`
  - `session_id: String`
  - `workspace_id: String`
- `spawn_claude_session(bin_path, workspace_id)`:
  - Calls `process_core::tokio_command()` with the sidecar binary path
  - Pipes stdin/stdout/stderr
  - Spawns stdout reader task (tokio)
  - Sends `claude/ping` to verify the process is responsive
- stdout reader:
  - Reads lines, parses as JSON
  - If `id` field present → look up oneshot sender, send result
  - If `method` field (server event) → emit to frontend via event sink
  - Event types: `claude/responseDelta`, `claude/toolEvent`
- `send_request(method, params)` — standard JSON-RPC request
- `kill()` — kill child process tree
- `is_alive()` — check child process health
- Idle timeout: tokio timer that fires after 15 min of no requests; kills process on expiry; auto-restart on next `send_request`

**Patterns to follow:**
- Existing `WorkspaceSession` in `app_server.rs` (line ~434)
- `process_core::kill_child_process_tree()` for cleanup
- `process_core::tokio_command()` for spawn

**Test scenarios:**
- Happy path: Spawn sidecar → `send_request("claude/ping", {})` → response received
- Error: Sidecar binary not found → spawn fails with clear error
- Error: Sidecar crashes → `is_alive()` returns false → `send_request` returns error
- Idle timeout: No requests for 15 min → process killed
- Auto-restart: After idle timeout, next `send_request` spawns new process

**Verification:**
- `ClaudeSession` can be spawned, pinged, and killed
- Messages flow bidirectionally (send_request + stdout reader)
- Workspace connect/disconnect properly handles lifecycle

---

- U5. **[Rust Command Handlers — Tauri Commands for Claude]**

**Goal:** Register Tauri commands that frontend calls for Claude Code operations

**Requirements:** R4, R6, R12

**Dependencies:** U4 (ClaudeSession exists), U1 (agent_type in workspace)

**Files:**
- Create: `src-tauri/src/claude/mod.rs`
- Modify: `src-tauri/src/lib.rs` (add `mod claude`, register commands)

**Approach:**
- Define command functions in `src-tauri/src/claude/mod.rs`:
  - `claude::start_thread(workspace_id, prompt)` → spawns/gets session, sends `claude/start`
  - `claude::send_message(workspace_id, prompt, session_id)` → sends `claude/query`
  - `claude::stop_thread(workspace_id)` → sends `claude/stop`
  - `claude::list_threads(workspace_id)` → sends `claude/thread/list`
  - `claude::resume_thread(workspace_id, session_id)` → sends `claude/thread/resume`
- Each command:
  1. Looks up `ClaudeSession` for the workspace from state
  2. Spawns one if not exists (calling `spawn_claude_session`)
  3. Sends the appropriate JSON-RPC request
  4. Returns the response (or kicks off streaming events)
- Register in `lib.rs` `generate_handler![]` and `tauri::Builder::invoke_handler()`
- Workspace selection: Frontend should check `agent_type == "claude"` before calling Claude commands (or backend can validate)

**Patterns to follow:**
- Existing `src-tauri/src/codex/mod.rs` pattern for command structure
- `lib.rs` handler registration pattern

**Test scenarios:**
- Happy path: Call `claude::start_thread` → returns session ID
- Error: Call Claude command on a Codex workspace → error returned
- Error: Sidecar not responding → error propagated from `send_request`

**Verification:**
- All registered commands appear in `invoke_handler` and work end-to-end
- Backend validates workspace type before dispatching to Claude vs Codex

---

- U6. **[Frontend IPC — Invoke Wrappers + Event Subscriptions]**

**Goal:** Add frontend service layer for Claude Code commands and events

**Requirements:** R2, R3, R5, R6, R8, R12, R13

**Dependencies:** U5 (command handlers registered), U4 (events flowing)

**Files:**
- Create: `src/services/claudeTauri.ts`
- Create: `src/services/claudeEvents.ts`
- Modify: `src/services/events.ts` (add Claude event hub)
- Modify: `src/utils/appServerEvents.ts` (add Claude method support)

**Approach:**
- `claudeTauri.ts` — parallel to `tauri.ts`:
  - `startClaudeThread(workspaceId, prompt)` → `invoke("claude::start_thread", {...})`
  - `sendClaudeMessage(workspaceId, prompt, sessionId)` → `invoke("claude::send_message", {...})`
  - `stopClaudeThread(workspaceId)` → `invoke("claude::stop_thread", {...})`
  - `listClaudeThreads(workspaceId)` → `invoke("claude::list_threads", {...})`
  - `resumeClaudeThread(workspaceId, sessionId)` → `invoke("claude::resume_thread", {...})`
- `claudeEvents.ts` — subscribe to `"claude-app-server-event"`:
  - Use `createEventHub` pattern from `events.ts`
  - Emit typed events: `onClaudeResponseDelta`, `onClaudeToolEvent`, `onClaudeError`
- `events.ts`: Add `claudeAppServerHub` using existing `createEventHub` factory
- `appServerEvents.ts`: Add Claude method names to supported methods list

**Test scenarios:**
- Happy path: Call `startClaudeThread` → invoke fires → result returns
- Error: Tauri not available → `isMissingTauriInvokeError` handles gracefully
- Event: Response delta received → `onClaudeResponseDelta` callback fires

**Verification:**
- All invoke wrappers return correct types
- Events flow from sidecar → Rust → Tauri event → frontend handler

---

- U7. **[Frontend UI — Workspace Creation + Agent Indicator]**

**Goal:** Update workspace UI to support agent type selection and display

**Requirements:** R1, R2, R3, R13

**Dependencies:** U1 (agent_type in model), U6 (IPC layer)

**Files:**
- Modify: `src/features/home/components/Home.tsx` (workspace creation)
- Modify: `src/features/workspaces/components/WorkspaceList.tsx` (visual indicator + filter)
- Modify: `src/features/workspaces/components/WorkspaceCreateDialog.tsx` (agent type selector)
- Modify: `src/features/workspaces/hooks/useWorkspaces.ts` (agent_type awareness)

**Approach:**
- Workspace creation dialog:
  - Add radio/selector: "Agent type: Codex | Claude Code"
  - Add warning: "This choice is permanent and cannot be changed after creation"
  - When Claude Code is selected, show additional options (claude_bin path, model)
- Workspace list:
  - Add icon/badge per item showing agent type (Claude logo or monogram)
  - Add filter dropdown for agent type
  - Add grouping by agent type in sort options
- Conversation view:
  - Show loading state while Sidecar starts (R13)
  - Show Claude Code session info in header

**Patterns to follow:**
- Existing workspace creation dialog pattern
- Existing workspace list icon and filtering patterns

**Test scenarios:**
- Happy path: Create Codex workspace → default behavior unchanged
- Happy path: Create Claude Code workspace → badge shows correctly
- Edge case: Filter by agent type → only matching workspaces shown
- Accessibility: Agent type indicator is not color-only (use icon + text)

**Verification:**
- Workspace creation works for both agent types
- Existing Codex workspaces retain "codex" agent type by default
- Filtering by agent type works correctly

---

- U8. **[Diff Integration — PostToolUse Events → Diff Panel]**

**Goal:** Display file changes from Claude Code tool calls in the diff panel

**Requirements:** R8

**Dependencies:** U2 (PostToolUse hook in sidecar), U6 (Claude events flowing)

**Files:**
- Modify: `src/features/design-system/diff/` → Add Claude-specific diff components or discriminator
- Modify: `src/features/threads/hooks/useThreadsReducer.ts` → handle `claude/toolEvent`
- Create or modify: `src/features/threads/components/MessageRow.tsx` or equivalent
- Modify: `src/styles/diff.css` (if needed for Claude-specific styling)

**Approach:**
- Receive `claude/toolEvent` on the Claude event hub
- Each event contains: `{tool: "Edit"|"Write"|"Bash", filePath: string, content: any}`
- For Edit/Write tools: extract file path and content, push to diff state
- Render diff using existing `@pierre/diffs` library and diff viewer components
- Add a `source` discriminator to event data so existing Codex diff state is unaffected
- The diff panel uses a discriminator key to show diffs from the active agent type

**Test scenarios:**
- Happy path: Edit tool fires → file change appears in diff panel within 5 seconds (AE3)
- Edge case: Bash tool runs but doesn't modify files → no diff event
- Edge case: Multiple rapid edits → events queue and display correctly
- Error: Tool event arrives but file no longer exists → graceful skip

**Verification:**
- `claude/toolEvent` events arrive at frontend and render in diff panel
- File changes are clickable and show diffs inline

---

- U9. **[Sidecar Lifecycle — Idle Timeout + Crash Recovery]**

**Goal:** Implement idle timeout, crash detection, and auto-restart for the Sidecar

**Requirements:** R12, R13

**Dependencies:** U4 (session exists for lifecycle management)

**Files:**
- Modify: `src-tauri/src/backend/claude_session.rs` (add timeout and recovery)
- Modify: `src/services/claudeEvents.ts` (add connection state events)

**Approach:**
- Idle timeout: Tokio timer, resets on each `send_request`; after 15 min of inactivity, kill process
- Crash detection: `is_alive()` checks `child.try_wait()`; if process exited, mark session as dead
- Auto-restart: On next `send_request` to a dead session, spawn a new Sidecar process
- Frontend state: Emit `claudeSession/stopped`, `claudeSession/started`, `claudeSession/error` events so UI can show appropriate state
- Initialization timeout: Sidecar spawn has configurable timeout (default 60s); UI shows loading state (R13)
- On app exit: Kill all Sidecar processes using `process_core::kill_child_process_tree()`

**Test scenarios:**
- Happy path: Sidecar idle for 15 min → process terminated
- Happy path: Subsequent request after idle timeout → new Sidecar spawned
- Error: Sidecar crashes mid-conversation → UI shows error state
- Error: Sidecar fails to initialize within timeout → error propagated to UI

**Verification:**
- Sidecar lifecycle adheres to R12 semantics
- Crash does not cause data loss for persisted sessions (Agent SDK auto-persists)
- User sees appropriate loading/error/success states

---

- U10. **[Configuration — claude_bin Setting]**

**Goal:** Add `claude_bin` setting to app and workspace configuration UI

**Requirements:** R10, R11

**Dependencies:** U1 (workspace model supports per-workspace settings)

**Files:**
- Modify: `src/features/settings/components/sections/SettingsCodexSection.tsx` or create `SettingsClaudeSection.tsx`
- Modify: `src/features/settings/hooks/useSettings.ts` (add claude_bin state)
- Modify: `src-tauri/src/types.rs` (ensure `claude_bin` in AppSettings)

**Approach:**
- Add `claude_bin: Option<String>` to `AppSettings` (defaults to None → resolve `claude` on PATH)
- Add `claude_bin: Option<String>` to workspace settings (overrides global)
- In settings UI: text input for binary path with "Find on PATH..." button
- In workspace settings: optional override with "Use global default" checkbox
- Settings changes take effect on next Sidecar spawn

**Patterns to follow:**
- Existing `codex_bin` settings pattern (SettingsCodexSection.tsx)

**Test scenarios:**
- Happy path: Set `claude_bin` to custom path → next Sidecar spawn uses that path (AE4)
- Edge case: `claude_bin` not set → fallback to PATH resolution
- Edge case: Invalid path → error shown in settings UI

**Verification:**
- Settings persist across app restarts
- Sidecar resolves the correct binary path

---

## System-Wide Impact

- **Interaction graph:** New `claude::*` Tauri commands registered alongside `codex::*` commands. Menu events for Claude Code workspace type. No modification to existing command handlers.
- **Error propagation:** Claude Session errors follow the same pattern as Codex errors — propagated as Tauri command errors and through the event channel.
- **State lifecycle risks:** New `claude_sessions` HashMap in state.rs. Idle timeout auto-cleanup prevents zombie processes. App exit handler kills all Sidecar processes.
- **Integration coverage:** Frontend must choose correct service layer (claudeTauri vs tauri) based on workspace `agent_type`. Components must not render Codex-specific controls for Claude workspaces.
- **Unchanged invariants:** All existing `codex::*` commands, `WorkspaceSession`, Codex event channel, and Codex UI components are untouched. The two systems are fully parallel.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Agent SDK API changes before implementation | Pin SDK version in package.json; upgrade on own schedule |
| Bun `build --compile` platform gaps | Test on each target platform early; document fallback to `bun run` for unsupported platforms |
| Sidecar adds 50 MB+ idle memory per workspace | R12 idle timeout 15-min auto-kill; user configurable; monitor in testing |
| Thread continuation across process restart | Agent SDK auto-persists to JSONL; thread list reconstructed from JSONL on session resume |
| PostToolUse does not expose file content (only notification) | Fallback: Sidecar reads file after PostToolUse fires and constructs diff from before/after snapshot |
| Dual-backend maintenance burden | Shared process management in `process_core.rs`; Sidecar codebase is ~200 lines TypeScript |

---

## Sources & References

- **Origin document:** `docs/brainstorms/claude-code-integration-requirements.md`
- **Agent SDK docs:** [TypeScript reference](https://code.claude.com/docs/en/agent-sdk/typescript) | [Hooks](https://code.claude.com/docs/en/agent-sdk/hooks) | [Sessions](https://code.claude.com/docs/en/agent-sdk/sessions)
- **Existing patterns:** `app_server.rs` (WorkspaceSession), `process_core.rs` (process management), `codex/mod.rs` (command handlers), `tauri.ts` (invoke wrappers), `events.ts` (event hubs)
- **Remote backend POC:** `REMOTE_BACKEND_POC.md` (alternative backend pattern)
