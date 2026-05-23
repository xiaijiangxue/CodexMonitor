import { readGlobalCodexConfigToml, writeGlobalCodexConfigToml } from "@services/tauri";
import { useFileEditor } from "@/features/shared/hooks/useFileEditor";
import i18n from "@/locales/i18n";

export function useGlobalCodexConfigToml() {
  return useFileEditor({
    key: "global-config",
    read: readGlobalCodexConfigToml,
    write: writeGlobalCodexConfigToml,
    readErrorTitle: i18n.t("couldNotLoadGlobalConfigToml", { ns: "settings" }),
    writeErrorTitle: i18n.t("couldNotSaveGlobalConfigToml", { ns: "settings" }),
  });
}
