import { readGlobalAgentsMd, writeGlobalAgentsMd } from "@services/tauri";
import { useFileEditor } from "@/features/shared/hooks/useFileEditor";
import i18n from "@/locales/i18n";

export function useGlobalAgentsMd() {
  return useFileEditor({
    key: "global-agents",
    read: readGlobalAgentsMd,
    write: writeGlobalAgentsMd,
    readErrorTitle: i18n.t("couldNotLoadGlobalAgentsMd", { ns: "settings" }),
    writeErrorTitle: i18n.t("couldNotSaveGlobalAgentsMd", { ns: "settings" }),
  });
}
