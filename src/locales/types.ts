export const namespaces = ["common", "layout"] as const;
export type Namespace = (typeof namespaces)[number];

export type LocaleResources = {
  common: typeof import("./en/common.json");
  layout: typeof import("./en/layout.json");
};
