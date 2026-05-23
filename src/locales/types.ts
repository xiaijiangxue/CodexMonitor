export const namespaces = ["common", "git", "home", "layout", "messages", "settings", "threads", "workspaces"] as const;
export type Namespace = (typeof namespaces)[number];

export type LocaleResources = {
  common: typeof import("./en/common.json");
  git: typeof import("./en/git.json");
  home: typeof import("./en/home.json");
  layout: typeof import("./en/layout.json");
  messages: typeof import("./en/messages.json");
  settings: typeof import("./en/settings.json");
  threads: typeof import("./en/threads.json");
  workspaces: typeof import("./en/workspaces.json");
};
