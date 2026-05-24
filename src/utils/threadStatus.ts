export type ThreadStatusFlags = {
  isProcessing?: boolean;
  hasUnread?: boolean;
  isReviewing?: boolean;
};

export type ThreadStatusById = Record<string, ThreadStatusFlags>;

export type ThreadStatusClass = "processing" | "reviewing" | "unread" | "ready";

import i18n from "../locales/i18n";

export function getThreadStatusClass(
  status: ThreadStatusFlags | undefined,
  hasPendingUserInput: boolean,
): ThreadStatusClass {
  if (hasPendingUserInput) {
    return "unread";
  }
  if (status?.isReviewing) {
    return "reviewing";
  }
  if (status?.isProcessing) {
    return "processing";
  }
  if (status?.hasUnread) {
    return "unread";
  }
  return "ready";
}

type WorkspaceHomeThreadState = {
  statusLabel: "Running" | "Reviewing" | "Idle";
  stateClass: "is-running" | "is-reviewing" | "is-idle";
  isRunning: boolean;
};

export function getWorkspaceHomeThreadState(
  status: ThreadStatusFlags | undefined,
): WorkspaceHomeThreadState {
  if (status?.isProcessing) {
    return { statusLabel: i18n.t("running", { ns: "threads" }) as "Running", stateClass: "is-running", isRunning: true };
  }
  if (status?.isReviewing) {
    return { statusLabel: i18n.t("reviewing", { ns: "threads" }) as "Running", stateClass: "is-reviewing", isRunning: false };
  }
  return { statusLabel: i18n.t("idle", { ns: "threads" }) as "Idle", stateClass: "is-idle", isRunning: false };
}
