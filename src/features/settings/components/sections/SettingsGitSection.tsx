import { useTranslation } from "react-i18next";
import type { AppSettings, ModelOption } from "@/types";
import {
  SettingsSection,
  SettingsToggleRow,
  SettingsToggleSwitch,
} from "@/features/design-system/components/settings/SettingsPrimitives";

type SettingsGitSectionProps = {
  appSettings: AppSettings;
  onUpdateAppSettings: (next: AppSettings) => Promise<void>;
  models: ModelOption[];
  commitMessagePromptDraft: string;
  commitMessagePromptDirty: boolean;
  commitMessagePromptSaving: boolean;
  onSetCommitMessagePromptDraft: (value: string) => void;
  onSaveCommitMessagePrompt: () => Promise<void>;
  onResetCommitMessagePrompt: () => Promise<void>;
};

export function SettingsGitSection({
  appSettings,
  onUpdateAppSettings,
  models,
  commitMessagePromptDraft,
  commitMessagePromptDirty,
  commitMessagePromptSaving,
  onSetCommitMessagePromptDraft,
  onSaveCommitMessagePrompt,
  onResetCommitMessagePrompt,
}: SettingsGitSectionProps) {
  const { t } = useTranslation("settings");
  return (
    <SettingsSection
      title={t("git.title")}
      subtitle={t("git.subtitle")}
    >
      <SettingsToggleRow
        title={t("git.preloadTitle")}
        subtitle={t("git.preloadSubtitle")}
      >
        <SettingsToggleSwitch
          pressed={appSettings.preloadGitDiffs}
          onClick={() =>
            void onUpdateAppSettings({
              ...appSettings,
              preloadGitDiffs: !appSettings.preloadGitDiffs,
            })
          }
        />
      </SettingsToggleRow>
      <SettingsToggleRow
        title={t("git.ignoreWhitespaceTitle")}
        subtitle={t("git.ignoreWhitespaceSubtitle")}
      >
        <SettingsToggleSwitch
          pressed={appSettings.gitDiffIgnoreWhitespaceChanges}
          onClick={() =>
            void onUpdateAppSettings({
              ...appSettings,
              gitDiffIgnoreWhitespaceChanges: !appSettings.gitDiffIgnoreWhitespaceChanges,
            })
          }
        />
      </SettingsToggleRow>
      <div className="settings-field">
        <div className="settings-field-label">{t("git.commitMessagePrompt")}</div>
        <div className="settings-help">
          {t("git.commitMessageHelp", { diff: "{diff}" })}
        </div>
        <textarea
          className="settings-agents-textarea"
          value={commitMessagePromptDraft}
          onChange={(event) => onSetCommitMessagePromptDraft(event.target.value)}
          spellCheck={false}
          disabled={commitMessagePromptSaving}
        />
        <div className="settings-field-actions">
          <button
            type="button"
            className="ghost settings-button-compact"
            onClick={() => {
              void onResetCommitMessagePrompt();
            }}
            disabled={commitMessagePromptSaving || !commitMessagePromptDirty}
          >
            {t("git.reset")}
          </button>
          <button
            type="button"
            className="primary settings-button-compact"
            onClick={() => {
              void onSaveCommitMessagePrompt();
            }}
            disabled={commitMessagePromptSaving || !commitMessagePromptDirty}
          >
            {commitMessagePromptSaving ? t("git.saving") : t("git.save")}
          </button>
        </div>
      </div>
      {models.length > 0 && (
        <div className="settings-field">
          <label className="settings-field-label" htmlFor="commit-message-model-select">
            {t("git.commitMessageModel")}
          </label>
          <div className="settings-help">
            {t("git.commitMessageModelHelp")}
          </div>
          <select
            id="commit-message-model-select"
            className="settings-select"
            value={appSettings.commitMessageModelId ?? ""}
            onChange={(event) => {
              const value = event.target.value || null;
              void onUpdateAppSettings({
                ...appSettings,
                commitMessageModelId: value,
              });
            }}
          >
            <option value="">{t("git.default")}</option>
            {models.map((model) => (
              <option key={model.id} value={model.model}>
                {model.displayName?.trim() || model.model}
              </option>
            ))}
          </select>
        </div>
      )}
    </SettingsSection>
  );
}
