import type { CodexFeature } from "@/types";
import { useTranslation } from "react-i18next";
import {
  SettingsSection,
  SettingsSubsection,
  SettingsToggleRow,
  SettingsToggleSwitch,
} from "@/features/design-system/components/settings/SettingsPrimitives";
import type { SettingsFeaturesSectionProps } from "@settings/hooks/useSettingsFeaturesSection";
import { fileManagerName, openInFileManagerLabel } from "@utils/platformPaths";

function featureNameToKeyParts(name: string): string[] {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.toLowerCase());
}

function normalizeFeatureText(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function translatePreventSleepFeature(
  feature: CodexFeature,
  t: (key: string, options?: Record<string, unknown>) => string,
): { title: string; subtitle: string } | null {
  const title = normalizeFeatureText(feature.displayName);
  const subtitle = normalizeFeatureText(feature.description);
  const announcement = normalizeFeatureText(feature.announcement);
  const name = normalizeFeatureText(feature.name);
  const titleAliases = new Set([
    "prevent sleep while running",
    "preventsleepwhilerunning",
  ]);
  const subtitleAliases = new Set([
    "keep your computer awake while codex is running a thread.",
  ]);
  if (
    titleAliases.has(title) ||
    titleAliases.has(name) ||
    subtitleAliases.has(subtitle) ||
    subtitleAliases.has(announcement)
  ) {
    return {
      title: t("features.titlePreventSleepWhileRunning"),
      subtitle: t("features.descPreventSleepWhileRunning"),
    };
  }
  return null;
}

function featureNameToDescKey(name: string): string {
  const parts = featureNameToKeyParts(name);
  return `features.desc${parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")}`;
}

function featureNameToTitleKey(name: string): string {
  const parts = featureNameToKeyParts(name);
  return `features.title${parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")}`;
}

function featureSubtitle(
  feature: CodexFeature,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const specialCase = translatePreventSleepFeature(feature, t);
  if (specialCase) {
    return specialCase.subtitle;
  }
  const descKey = featureNameToDescKey(feature.name);
  const translatedDesc = t(descKey);
  if (translatedDesc !== descKey) {
    return translatedDesc;
  }
  if (feature.description?.trim()) {
    return feature.description;
  }
  if (feature.announcement?.trim()) {
    return feature.announcement;
  }
  if (feature.stage === "deprecated") {
    return t("features.featureDeprecated");
  }
  if (feature.stage === "removed") {
    return t("features.featureRemoved");
  }
  return t("features.featureKey", { name: feature.name });
}

function formatFeatureLabel(
  feature: CodexFeature,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const specialCase = translatePreventSleepFeature(feature, t);
  if (specialCase) {
    return specialCase.title;
  }
  const titleKey = featureNameToTitleKey(feature.name);
  const translatedTitle = t(titleKey);
  if (translatedTitle !== titleKey) {
    return translatedTitle;
  }
  const displayName = feature.displayName?.trim();
  if (displayName) {
    return displayName;
  }
  return feature.name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function SettingsFeaturesSection({
  appSettings,
  hasFeatureWorkspace,
  openConfigError,
  featureError,
  featuresLoading,
  featureUpdatingKey,
  stableFeatures,
  experimentalFeatures,
  hasDynamicFeatureRows,
  onOpenConfig,
  onToggleCodexFeature,
  onUpdateAppSettings,
}: SettingsFeaturesSectionProps) {
  const { t } = useTranslation("settings");

  return (
    <SettingsSection
      title={t("features.title")}
      subtitle={t("features.subtitle")}
    >
      <SettingsToggleRow
        title={t("features.configFile")}
        subtitle={t("features.configFileSub", { fileManager: fileManagerName() })}
      >
        <button type="button" className="ghost" onClick={onOpenConfig}>
          {openInFileManagerLabel()}
        </button>
      </SettingsToggleRow>
      {openConfigError && <div className="settings-help">{openConfigError}</div>}
      <SettingsSubsection
        title={t("features.stableTitle")}
        subtitle={t("features.stableSubtitle")}
      />
      <SettingsToggleRow
        title={t("features.personality")}
        subtitle={t("features.personalityHelp")}
      >
        <select
          id="features-personality-select"
          className="settings-select"
          value={appSettings.personality}
          onChange={(event) =>
            void onUpdateAppSettings({
              ...appSettings,
              personality: event.target.value as (typeof appSettings)["personality"],
            })
          }
          aria-label={t("features.personality")}
        >
          <option value="friendly">{t("features.personalityFriendly")}</option>
          <option value="pragmatic">{t("features.personalityPragmatic")}</option>
        </select>
      </SettingsToggleRow>
      <SettingsToggleRow
        title={t("features.pauseTitle")}
        subtitle={t("features.pauseSubtitle")}
      >
        <SettingsToggleSwitch
          pressed={appSettings.pauseQueuedMessagesWhenResponseRequired}
          onClick={() =>
            void onUpdateAppSettings({
              ...appSettings,
              pauseQueuedMessagesWhenResponseRequired:
                !appSettings.pauseQueuedMessagesWhenResponseRequired,
            })
          }
        />
      </SettingsToggleRow>
      {stableFeatures.map((feature) => (
        <SettingsToggleRow
          key={feature.name}
          title={formatFeatureLabel(feature, t)}
          subtitle={featureSubtitle(feature, t)}
        >
          <SettingsToggleSwitch
            pressed={feature.enabled}
            onClick={() => onToggleCodexFeature(feature)}
            disabled={featureUpdatingKey === feature.name}
          />
        </SettingsToggleRow>
      ))}
      {hasFeatureWorkspace &&
        !featuresLoading &&
        !featureError &&
        stableFeatures.length === 0 && (
          <div className="settings-help">{t("features.noStableFlags")}</div>
        )}
      <SettingsSubsection
        title={t("features.experimentalTitle")}
        subtitle={t("features.experimentalSubtitle")}
      />
      {experimentalFeatures.map((feature) => (
        <SettingsToggleRow
          key={feature.name}
          title={formatFeatureLabel(feature, t)}
          subtitle={featureSubtitle(feature, t)}
        >
          <SettingsToggleSwitch
            pressed={feature.enabled}
            onClick={() => onToggleCodexFeature(feature)}
            disabled={featureUpdatingKey === feature.name}
          />
        </SettingsToggleRow>
      ))}
      {hasFeatureWorkspace &&
        !featuresLoading &&
        !featureError &&
        hasDynamicFeatureRows &&
        experimentalFeatures.length === 0 && (
          <div className="settings-help">
            {t("features.noExperimentalFlags")}
          </div>
        )}
      {featuresLoading && (
        <div className="settings-help">{t("features.loadingFlags")}</div>
      )}
      {!hasFeatureWorkspace && !featuresLoading && (
        <div className="settings-help">{t("features.connectForFlags")}</div>
      )}
      {featureError && <div className="settings-help">{featureError}</div>}
    </SettingsSection>
  );
}
