# 未汉化文件列表

> 最后更新: 2026-05-24 | 主分支已完成 11 个提交 | 124 文件变更 5168 行新增


- src/features/app/components/ApprovalToasts.tsx
- src/features/app/components/LaunchScriptButton.tsx
- src/features/app/components/LaunchScriptEntryButton.tsx
- src/features/app/components/MainApp.tsx
- src/features/app/components/MainHeader.tsx
- src/features/app/components/MainHeaderActions.tsx
- src/features/app/components/OpenAppMenu.tsx
- src/features/app/components/PlanReadyFollowupMessage.tsx
- src/features/app/components/RequestUserInputMessage.tsx
- src/features/app/components/SidebarSearchBar.tsx
- src/features/app/components/SidebarThreadsOnlySection.tsx
- src/features/app/components/SidebarWorkspaceGroups.tsx
- src/features/app/components/ThreadList.tsx
- src/features/app/components/ThreadLoading.tsx
- src/features/app/components/ThreadRow.tsx
- src/features/app/components/WorkspaceCard.tsx
- src/features/app/components/WorkspaceGroup.tsx
- src/features/app/components/WorktreeCard.tsx
- src/features/app/components/WorktreeSection.tsx
- src/features/app/hooks/useMainAppDisplayNodes.tsx
- src/features/app/hooks/useMainAppShellProps.tsx
- src/features/messages/components/Markdown.tsx
- src/features/settings/components/sections/SettingsAboutSection.tsx
- src/features/settings/components/sections/SettingsAgentsSection.tsx
- src/features/settings/components/sections/SettingsCodexSection.tsx
- src/features/settings/components/sections/SettingsComposerSection.tsx
- src/features/settings/components/sections/SettingsDictationSection.tsx
- src/features/settings/components/sections/SettingsEnvironmentsSection.tsx
- src/features/settings/components/sections/SettingsFeaturesSection.tsx
- src/features/settings/components/sections/SettingsGitSection.tsx
- src/features/settings/components/sections/SettingsProjectsSection.tsx
- src/features/settings/components/sections/SettingsServerSection.tsx
- src/features/settings/components/sections/SettingsShortcutsSection.tsx
- src/features/shared/components/FileEditorCard.tsx
- src/features/workspaces/components/ClonePrompt.tsx
- src/features/workspaces/components/MobileRemoteWorkspacePrompt.tsx
- src/features/workspaces/components/WorkspaceFromUrlPrompt.tsx
- src/features/workspaces/components/WorkspaceHome.tsx
- src/features/workspaces/components/WorkspaceHomeGitInitBanner.tsx
- src/features/workspaces/components/WorkspaceHomeHistory.tsx
- src/features/workspaces/components/WorkspaceHomeRunControls.tsx
- src/features/workspaces/components/WorktreePrompt.tsx

---

## 已迁移但组件内仍有少量硬编码字符串的文件
- src/features/app/components/Sidebar.tsx (~3 处)
- src/features/app/components/SidebarBottomRail.tsx (~3 处)
- src/features/composer/components/Composer.tsx (~4 处)
- src/features/git/components/BranchSwitcherPrompt.tsx (~4 处)
- src/features/git/components/InitGitRepoPrompt.tsx (~4 处)
- src/features/layout/components/PanelTabs.tsx (~4 处)
- src/features/messages/components/MessageRows.tsx (~15 处)
- src/features/settings/components/sections/SettingsDisplaySection.tsx (~15 处)
- src/features/settings/components/sections/SettingsOpenAppsSection.tsx (~15 处)

## 包含硬编码字符串的 TS 工具文件（非组件）
- src/features/app/constants.ts (~13 处)
- src/features/app/hooks/useLiquidGlassEffect.ts (~3 处)
- src/features/app/hooks/useSidebarMenus.ts (~12 处)
- src/features/app/hooks/useTrayRecentThreads.ts (~3 处)
- src/features/app/hooks/useWorkspaceDialogs.ts (~10 处)
- src/features/app/utils/launchScriptIcons.ts (~15 处)
- src/features/composer/hooks/useComposerKeyDown.ts (~3 处)
- src/features/composer/hooks/usePromptHistory.ts (~3 处)
- src/features/home/homeFormatters.ts (~3 处)
- src/features/home/homeUsageViewModel.ts (~34 处)
- src/features/messages/hooks/useFileLinkOpener.ts (~9 处)
- src/features/settings/components/settingsViewConstants.ts (~19 处)
- src/features/settings/components/settingsViewHelpers.ts (~3 处)
- src/features/settings/hooks/useSettingsProjectsSection.ts (~3 处)
- src/features/settings/hooks/useSettingsShortcutDrafts.ts (~3 处)
- src/features/settings/hooks/useSettingsViewOrchestration.ts (~6 处)
- src/features/threads/hooks/useReviewPrompt.ts (~5 处)
- src/features/update/hooks/useUpdater.ts (~3 处)
- src/features/workspaces/hooks/useWorkspaceDropZone.ts (~3 处)
- src/services/tauri.ts (~3 处)
- src/test/vitest.setup.ts (~4 处)
- src/utils/customPrompts.ts (~5 处)
- src/utils/keys.ts (~4 处)
- src/utils/platformPaths.ts (~6 处)
- src/utils/shortcuts.ts (~26 处)
- src/utils/threadItems.conversion.ts (~7 处)
- src/utils/threadStatus.ts (~4 处)
- src/utils/threadText.ts (~5 处)
