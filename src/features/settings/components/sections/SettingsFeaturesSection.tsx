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

function featureNameToDescKey(name: string): string {
  const parts = name.split("_").filter(Boolean);
  return `features.desc${parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")}`;
}

function featureNameToTitleKey(name: string): string {
  const parts = name.split("_").filter(Boolean);
  return `features.title${parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")}`;
}

function featureSubtitle(
  feature: CodexFeature,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
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
  const descKey = featureNameToDescKey(feature.name);
  const translated = t(descKey);
  // i18next returns the key string itself when no translation is found
  if (translated !== descKey) {
    return translated;
  }
  return t("features.featureKey", { name: feature.name });
}

function formatFeatureLabel(
  feature: CodexFeature,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const displayName = feature.displayName?.trim();
  if (displayName) {
    return displayName;
  }
  const titleKey = featureNameToTitleKey(feature.name);
  const translated = t(titleKey);
  if (translated !== titleKey) {
    return translated;
  }
  return feature.name
    .split("_")
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
