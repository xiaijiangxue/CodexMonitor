export const namespaces = ["app", "common", "composer", "dictation", "git", "home", "layout", "messages", "models", "notifications", "settings", "terminal", "threads", "workspaces"] as const;
export type Namespace = (typeof namespaces)[number];

export type LocaleResources = {
  app: typeof import("./en/app.json");
  common: typeof import("./en/common.json");
  composer: typeof import("./en/composer.json");
  dictation: typeof import("./en/dictation.json");
  git: typeof import("./en/git.json");
  home: typeof import("./en/home.json");
  layout: typeof import("./en/layout.json");
  messages: typeof import("./en/messages.json");
  models: typeof import("./en/models.json");
  notifications: typeof import("./en/notifications.json");
  settings: typeof import("./en/settings.json");
  terminal: typeof import("./en/terminal.json");
  threads: typeof import("./en/threads.json");
  workspaces: typeof import("./en/workspaces.json");
};
