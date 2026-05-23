export const namespaces = ["common", "home", "layout", "settings"] as const;
export type Namespace = (typeof namespaces)[number];

export type LocaleResources = {
  common: typeof import("./en/common.json");
  home: typeof import("./en/home.json");
  layout: typeof import("./en/layout.json");
  settings: typeof import("./en/settings.json");
};
