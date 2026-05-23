import { useTranslation } from "react-i18next";
import { useMemo, useState, type KeyboardEvent } from "react";
import {
  SettingsSection,
  SettingsSubsection,
} from "@/features/design-system/components/settings/SettingsPrimitives";
import { formatShortcut, getDefaultInterruptShortcut } from "@utils/shortcuts";
import { isMacPlatform } from "@utils/platformPaths";
import type {
  ShortcutDraftKey,
  ShortcutDrafts,
  ShortcutSettingKey,
} from "@settings/components/settingsTypes";

type ShortcutItem = {
  label: string;
  draftKey: ShortcutDraftKey;
  settingKey: ShortcutSettingKey;
  help: string;
};

type ShortcutGroup = {
  title: string;
  subtitle: string;
  items: ShortcutItem[];
};

type SettingsShortcutsSectionProps = {
  shortcutDrafts: ShortcutDrafts;
  onShortcutKeyDown: (
    event: KeyboardEvent<HTMLInputElement>,
    key: ShortcutSettingKey,
  ) => void;
  onClearShortcut: (key: ShortcutSettingKey) => void;
};

function ShortcutField({
  item,
  shortcutDrafts,
  onShortcutKeyDown,
  onClearShortcut,
}: {
  item: ShortcutItem;
  shortcutDrafts: ShortcutDrafts;
  onShortcutKeyDown: (
    event: KeyboardEvent<HTMLInputElement>,
    key: ShortcutSettingKey,
  ) => void;
  onClearShortcut: (key: ShortcutSettingKey) => void;
}) {
  const { t } = useTranslation("settings");
  return (
    <div className="settings-field">
      <div className="settings-field-label">{item.label}</div>
      <div className="settings-field-row">
        <input
          className="settings-input settings-input--shortcut"
          value={formatShortcut(shortcutDrafts[item.draftKey])}
          onKeyDown={(event) => onShortcutKeyDown(event, item.settingKey)}
          placeholder={t("shortcuts.typePlaceholder")}
          readOnly
        />
        <button
          type="button"
          className="ghost settings-button-compact"
          onClick={() => onClearShortcut(item.settingKey)}
        >
          {t("shortcuts.clear")}
        </button>
      </div>
      <div className="settings-help">{item.help}</div>
    </div>
  );
}

export function SettingsShortcutsSection({
  shortcutDrafts,
  onShortcutKeyDown,
  onClearShortcut,
}: SettingsShortcutsSectionProps) {
  const { t } = useTranslation("settings");
  const isMac = isMacPlatform();
  const [searchQuery, setSearchQuery] = useState("");

  const groups = useMemo<ShortcutGroup[]>(
    () => [
      {
        title: t("shortcuts.groupFile"),
        subtitle: t("shortcuts.groupFileSub"),
        items: [
          {
            label: t("shortcuts.itemNewAgent"),
            draftKey: "newAgent",
            settingKey: "newAgentShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut("cmd+n") }),
          },
          {
            label: t("shortcuts.itemNewWorktreeAgent"),
            draftKey: "newWorktreeAgent",
            settingKey: "newWorktreeAgentShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut("cmd+shift+n") }),
          },
          {
            label: t("shortcuts.itemNewCloneAgent"),
            draftKey: "newCloneAgent",
            settingKey: "newCloneAgentShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut("cmd+alt+n") }),
          },
          {
            label: t("shortcuts.itemArchiveThread"),
            draftKey: "archiveThread",
            settingKey: "archiveThreadShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut(isMac ? "cmd+ctrl+a" : "ctrl+alt+a") }),
          },
        ],
      },
      {
        title: t("shortcuts.groupComposer"),
        subtitle: t("shortcuts.groupComposerSub"),
        items: [
          {
            label: t("shortcuts.itemCycleModel"),
            draftKey: "model",
            settingKey: "composerModelShortcut",
            help: t("shortcuts.pressNewHelp", { shortcut: formatShortcut("cmd+shift+m") }),
          },
          {
            label: t("shortcuts.itemCycleAccess"),
            draftKey: "access",
            settingKey: "composerAccessShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut("cmd+shift+a") }),
          },
          {
            label: t("shortcuts.itemCycleReasoning"),
            draftKey: "reasoning",
            settingKey: "composerReasoningShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut("cmd+shift+r") }),
          },
          {
            label: t("shortcuts.itemCycleCollaboration"),
            draftKey: "collaboration",
            settingKey: "composerCollaborationShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut("shift+tab") }),
          },
          {
            label: t("shortcuts.itemStopRun"),
            draftKey: "interrupt",
            settingKey: "interruptShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut(getDefaultInterruptShortcut()) }),
          },
        ],
      },
      {
        title: t("shortcuts.groupPanels"),
        subtitle: t("shortcuts.groupPanelsSub"),
        items: [
          {
            label: t("shortcuts.itemToggleProjects"),
            draftKey: "projectsSidebar",
            settingKey: "toggleProjectsSidebarShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut("cmd+shift+p") }),
          },
          {
            label: t("shortcuts.itemToggleGit"),
            draftKey: "gitSidebar",
            settingKey: "toggleGitSidebarShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut("cmd+shift+g") }),
          },
          {
            label: t("shortcuts.itemBranchSwitcher"),
            draftKey: "branchSwitcher",
            settingKey: "branchSwitcherShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut("cmd+b") }),
          },
          {
            label: t("shortcuts.itemToggleDebug"),
            draftKey: "debugPanel",
            settingKey: "toggleDebugPanelShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut("cmd+shift+d") }),
          },
          {
            label: t("shortcuts.itemToggleTerminal"),
            draftKey: "terminal",
            settingKey: "toggleTerminalShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut("cmd+shift+t") }),
          },
        ],
      },
      {
        title: t("shortcuts.groupNavigation"),
        subtitle: t("shortcuts.groupNavigationSub"),
        items: [
          {
            label: t("shortcuts.itemNextAgent"),
            draftKey: "cycleAgentNext",
            settingKey: "cycleAgentNextShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut(isMac ? "cmd+ctrl+down" : "ctrl+alt+down") }),
          },
          {
            label: t("shortcuts.itemPrevAgent"),
            draftKey: "cycleAgentPrev",
            settingKey: "cycleAgentPrevShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut(isMac ? "cmd+ctrl+up" : "ctrl+alt+up") }),
          },
          {
            label: t("shortcuts.itemNextWorkspace"),
            draftKey: "cycleWorkspaceNext",
            settingKey: "cycleWorkspaceNextShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut(isMac ? "cmd+shift+down" : "ctrl+alt+shift+down") }),
          },
          {
            label: t("shortcuts.itemPrevWorkspace"),
            draftKey: "cycleWorkspacePrev",
            settingKey: "cycleWorkspacePrevShortcut",
            help: t("shortcuts.defaultHelp", { shortcut: formatShortcut(isMac ? "cmd+shift+up" : "ctrl+alt+shift+up") }),
          },
        ],
      },
    ],
    [isMac, t],
  );

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!normalizedSearchQuery) {
      return groups;
    }
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const searchValue = `${group.title} ${group.subtitle} ${item.label} ${item.help}`.toLowerCase();
          return searchValue.includes(normalizedSearchQuery);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, normalizedSearchQuery]);

  return (
    <SettingsSection
      title={t("shortcuts.title")}
      subtitle={t("shortcuts.subtitle")}
    >
      <div className="settings-field settings-shortcuts-search">
        <label className="settings-field-label" htmlFor="settings-shortcuts-search">
          {t("shortcuts.searchLabel")}
        </label>
        <div className="settings-field-row">
          <input
            id="settings-shortcuts-search"
            className="settings-input"
            placeholder={t("shortcuts.searchPlaceholder")}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="ghost settings-button-compact"
              onClick={() => setSearchQuery("")}
            >
              {t("shortcuts.clear")}
            </button>
          )}
        </div>
        <div className="settings-help">{t("shortcuts.searchHelp")}</div>
      </div>
      {filteredGroups.map((group, index) => (
        <div key={group.title}>
          {index > 0 && <div className="settings-divider" />}
          <SettingsSubsection title={group.title} subtitle={group.subtitle} />
          {group.items.map((item) => (
            <ShortcutField
              key={item.settingKey}
              item={item}
              shortcutDrafts={shortcutDrafts}
              onShortcutKeyDown={onShortcutKeyDown}
              onClearShortcut={onClearShortcut}
            />
          ))}
        </div>
      ))}
      {filteredGroups.length === 0 && (
        <div className="settings-empty">
          {normalizedSearchQuery
            ? t("shortcuts.noMatchQuery", { query: searchQuery.trim() })
            : t("shortcuts.noMatch")}
        </div>
      )}
    </SettingsSection>
  );
}
