export const namespaces = ["app", "common", "composer", "git", "home", "layout", "messages", "settings", "threads", "workspaces"] as const;
export type Namespace = (typeof namespaces)[number];

export type LocaleResources = {
  app: typeof import("./en/app.json");
  common: typeof import("./en/common.json");
  composer: typeof import("./en/composer.json");
  git: typeof import("./en/git.json");
  home: typeof import("./en/home.json");
  layout: typeof import("./en/layout.json");
  messages: typeof import("./en/messages.json");
  settings: typeof import("./en/settings.json");
  threads: typeof import("./en/threads.json");
  workspaces: typeof import("./en/workspaces.json");
};
