---
title: 添加前端国际化 (i18n) 与中文支持
type: feat
status: active
date: 2026-05-24
---

# 添加前端国际化 (i18n) 与中文支持

## Summary

为 CodexMonitor（Tauri v2 + React 19 桌面应用）添加国际化基础设施，将所有硬编码 UI 字符串提取到按功能命名的空间 JSON 文件中，并提供中文（zh-CN）翻译。采用 i18next + react-i18next 方案，分阶段逐步迁移，优先覆盖高频交互界面。

---

## Problem Frame

CodexMonitor 是一个面向中文和英文用户的桌面工具，但所有 557 个组件文件中的 UI 文本均为硬编码英文。这限制了中文用户的使用体验，也为后续多语言扩展带来了困难。项目无任何国际化基础设施，需要从零搭建。

---

## Requirements

- R1. 建立前端国际化基础设施：i18n 库、配置、语言检测、类型安全
- R2. 将核心 UI 字符串从硬编码迁移到 `t()` 翻译函数调用
- R3. 提供完整的中文（zh-CN）翻译
- R4. 支持运行时语言切换（无需重启应用）
- R5. 语言偏好持久化（localStorage 或 Tauri settings）
- R6. 自动检测系统语言作为初始语言
- R7. 增量迁移：不要求一次性完成所有文件的迁移

---

## Scope Boundaries

- 仅覆盖前端 UI 字符串，不涉及 Rust 后端的错误消息或其他输出
- 不处理 RTL 语言方向（中文和英文同为 LTR）
- 不改变现有 UI 布局或交互逻辑
- 不修改测试或 CI/CD 流程
- 初始版本只提供 en 和 zh-CN 两个语言

---

## Context & Research

### Relevant Code and Patterns

- 所有 UI 文本均硬编码在 `src/features/*/` 下的 TSX 文件中
- 共享 UI 组件位于 `src/features/design-system/` 和 `src/features/shared/`
- 入口文件：`src/main.tsx`（React 启动），`src/App.tsx`（路由）
- 设置持久化参考现有 `localStorage` 和 Tauri settings 使用方式
- 应用设置页面位于 `src/features/settings/`（42 文件，适合放置语言切换 UI）

### External References

- react-i18next 官方文档：/i18next/react-i18next
- i18next 官方文档：/i18next/i18next
- Namespaces 管理大型项目的翻译文件
- CustomTypeOptions 提供类型安全的翻译键

---

## Key Technical Decisions

- **i18next + react-i18next**：最成熟的 React 国际化方案，支持命名空间、延迟加载、插值、复数、TypeScript 类型安全，React 19 兼容
- **按功能命名空间组织翻译**：每个 `src/features/<name>/` 对应一个翻译命名空间（如 `home`、`settings`、`threads`），翻译文件放在 `src/locales/{lng}/{namespace}.json`。这样模块化好、可独立加载、多人协作方便
- **静态资源加载**（非 HTTP Backend）：因为是 Tauri 桌面应用（无 Web 服务器），使用动态 `import()` 在初始化时加载翻译 JSON，不需要 `i18next-http-backend`
- **语言检测**：`navigator.language` + `localStorage` 覆盖。`i18next-browser-languagedetector` 提供开箱即用的检测链
- **语言持久化**：通过 `localStorage` 存储 `i18nextLng` 键（检测器默认），后续可以同步到 Tauri settings
- **TypeScript 类型安全**：扩展 `CustomTypeOptions` 让 `t()` 函数获得完整的键名自动补全和编译时检查
- **渐进式迁移**：不冻结开发，依次按命名空间迁移，每个迁移一个 PR

---

## Implementation Units

- U1. **安装依赖与创建基础设施**

**Goal:** 安装 i18n 依赖包，创建配置文件、目录结构、TypeScript 类型定义

**Requirements:** R1

**Dependencies:** None

**Files:**
- Create: `src/locales/i18n.ts`
- Create: `src/locales/types.ts`
- Create: `src/locales/en/common.json`
- Create: `src/locales/en/home.json`
- Create: `src/locales/en/settings.json`
- Create: `src/locales/zh-CN/common.json`
- Create: `src/locales/zh-CN/home.json`
- Create: `src/locales/zh-CN/settings.json`
- Modify: `src/main.tsx`
- Modify: `package.json`

**Approach:**
- 安装 `i18next`、`react-i18next`、`i18next-browser-languagedetector`（不安装 `i18next-http-backend`，因为 Tauri 没有 HTTP 服务）
- 创建 `src/locales/i18n.ts`：初始化 i18next，配置 `initReactI18next`、`LanguageDetector`，在 `init` 时将翻译 JSON 作为 `resources` 参数传入（通过动态 import 加载或直接 import）
- 创建 TypeScript 类型声明文件，扩展 `i18next` 的 `CustomTypeOptions` 以实现类型安全的 `t()` 调用
- 在 `src/main.tsx` 中 `import './locales/i18n'` 完成初始化
- 创建 en（英文参考）和 zh-CN 的第一个命名空间 `common`（核心/共享字符串）的 JSON 文件

**Test scenarios:**
- Happy path: i18n 初始化成功后，`t('key')` 返回正确的翻译字符串
- Happy path: 语言检测器读取 `navigator.language`，若为 `zh-CN` 则自动使用中文
- Happy path: `localStorage` 中存储的语言偏好覆盖系统语言
- Edge case: 不支持的浏览器语言（如 `fr`）回退到 `fallbackLng: 'en'`
- Error path: 翻译 JSON 文件损坏或缺失时，应用不应崩溃，使用 fallback 语言

**Verification:**
- 应用正常启动，无控制台 i18n 报错
- `useTranslation()` 返回正确的语言和翻译文本

---

- U2. **新建 `useT` 命名空间钩子辅助函数**

**Goal:** 创建一个带默认命名空间的 `useT` 包装函数，减少每个组件的样板代码，同时保持类型安全

**Requirements:** R1

**Dependencies:** U1

**Files:**
- Create: `src/locales/useT.ts`

**Approach:**
- 创建一个简单的 `useT(ns: Namespace)` 函数，封装 `useTranslation(ns)` 并返回 `t` 和 `i18n`
- 导出一个 `useCommon()` 快捷方式（相当于 `useTranslation('common')`）
- 类型安全的 `Namespaces` 联合类型，确保错误命名空间在编译时被发现

**Test scenarios:**
- Happy path: `useCommon()` 返回 `t` 函数，正确加载 `common` 命名空间的翻译
- Edge case: 命名空间尚未加载时，`t()` 返回键名本身作为回退

**Verification:**
- 带命名空间的 `t()` 调用正常工作，类型检查通过

---

- U3. **提取设计系统与共享组件字符串**

**Goal:** 将 `design-system` 和 `shared` 中的硬编码字符串迁移到 `common` 命名空间。这两处是全局复用的基础组件（按钮、弹窗、提示、选项卡等），优先迁移可让多个功能区域同步受益

**Requirements:** R2

**Dependencies:** U2

**Files:**
- Modify: `src/locales/en/common.json`
- Modify: `src/locales/zh-CN/common.json`
- Modify: `src/features/design-system/components/modal/ModalShell.tsx`
- Modify: `src/features/design-system/components/toast/ToastPrimitives.tsx`
- Modify: `src/features/design-system/components/popover/PopoverPrimitives.tsx`
- Modify: `src/features/design-system/components/settings/SettingsPrimitives.tsx`
- Test: `src/features/design-system/components/modal/ModalShell.test.tsx`
- Test: `src/features/design-system/components/toast/ToastPrimitives.test.tsx`

**Approach:**
- 审查每个设计系统组件的 render 部分，识别所有纯文本字符串
- 将字符串键定义在 `common.json` 的嵌套结构中，如 `"modal": { "close": "关闭", "confirm": "确认" }`
- 使用 `useCommon()` 包装组件
- 将 JSX 文本 `<div>Close</div>` 替换为 `<div>{t('modal.close')}</div>`
- 对于 aria-label、placeholder 等属性也同步迁移

**Test scenarios:**
- Happy path: `<ModalShell>` 渲染的关闭按钮文本正确显示为 `t('modal.close')`
- Happy path: Toast 关闭按钮、确认弹窗按钮等使用翻译文本
- Integration: 切换语言后，设计系统组件立即刷新显示新语言的文本
- Error path: 翻译键缺失时显示键名本身而非崩溃

**Verification:**
- 所有修改的设计系统组件正常运行
- 测试通过，无回归

---

- U4. **提取布局与导航字符串**

**Goal:** 将侧边栏、标题栏、导航等布局组件的硬编码字符串迁移到 `layout` 命名空间

**Requirements:** R2

**Dependencies:** U1

**Files:**
- Create: `src/locales/en/layout.json`
- Create: `src/locales/zh-CN/layout.json`
- Modify: `src/features/layout/` 下的相关文件（29 个）

**Approach:**
- 提取侧边栏标签（如 "Threads"、"Workspaces"、"Settings"）
- 提取标题栏、导航项、应用标题 "Codex Monitor" 等
- 在 `layout.json` 中以逻辑分组组织键名

**Patterns to follow:**
- U3 中提取设计系统组件的模式

**Test scenarios:**
- Happy path: 侧边栏所有导航标签使用 `t()` 调用，显示正确翻译
- Happy path: 应用标题在语言切换时更新
- Edge case: 较长的中文文本在侧边栏中不溢出或截断（如有需要调整 CSS）

**Verification:**
- 布局组件在英文和中文下均正确渲染
- 中文字符串不因为长度导致布局错位

---

- U5. **提取主页面/仪表盘字符串**

**Goal:** 将首页仪表盘（使用统计、近期活动）的硬编码字符串迁移到 `home` 命名空间

**Requirements:** R2

**Dependencies:** U1

**Files:**
- Create: `src/locales/en/home.json`（如果 U1 已创建则改为 Modify）
- Create: `src/locales/zh-CN/home.json`（同上）
- Modify: `src/features/home/` 下的相关文件（9 个）
- Test: `src/features/home/` 下的测试文件

**Approach:**
- 提取统计卡片标签（"Active Threads"、"API Calls" 等）
- 提取时间范围标签（"Last 7 days"、"Today" 等）
- 注意 `Intl.NumberFormat` 和 `Intl.DateTimeFormat` 已经是区域感知的，无需改动
- 英文 JSON 作为源文本参考，中文 JSON 提供完整翻译

**Test scenarios:**
- Happy path: 仪表盘所有静态标签正确显示中文翻译
- Edge case: 数字格式保持与操作系统语言一致（`Intl.NumberFormat` 已是区域感知）
- Edge case: 时间范围描述（如 "3 days ago"）的本地化

**Verification:**
- 首页在英文和中文下显示正常，数据加载和渲染不受影响

---

- U6. **提取设置页面字符串**

**Goal:** 将设置页面的所有标签、描述、标题迁移到 `settings` 命名空间

**Requirements:** R2

**Dependencies:** U1

**Files:**
- Create: `src/locales/en/settings.json`（如果 U1 已创建则改为 Modify）
- Create: `src/locales/zh-CN/settings.json`（同上）
- Modify: `src/features/settings/` 下的相关文件（42 个）

**Approach:**
- 设置页面有明确的层级结构（分区标题、设置项标签、描述文本），JSON 按此结构组织
- 特别注意设置项 `SETTINGS_SECTION_LABELS` 等常量的迁移
- 工具提示和占位符文本也要覆盖

**Patterns to follow:**
- U3 和 U4 的字符串提取模式

**Test scenarios:**
- Happy path: 所有设置分区标题、项标签、描述文本正确显示中文翻译
- Happy path: 搜索设置时中文关键词能匹配到对应的设置项
- Edge case: 键盘快捷键描述中的组合键格式（如 `cmd+n`）不应被翻译

**Verification:**
- 设置页面所有文本已迁移到 `t()` 调用
- 设置功能正常

---

- U7. **添加语言切换界面**

**Goal:** 在设置页面添加语言选择下拉框，支持运行时切换 en/zh-CN

**Requirements:** R4, R5

**Dependencies:** U1

**Files:**
- Create: `src/features/settings/components/LanguageSetting.tsx`
- Modify: `src/features/settings/` 下的设置页面路由文件
- Modify: `src/features/settings/` 下的设置项排列文件

**Approach:**
- 创建一个 `LanguageSetting` 组件，使用 `<select>` 呈现语言选项
- 选项：`English`、`简体中文`
- 调用 `i18n.changeLanguage(lng)` 切换语言
- 语言偏好通过 `i18next-browser-languagedetector` 的 `localStorage` 检测器自动持久化
- 利用 React i18next 的 `Suspense` 机制或 `useTranslation` + `bindI18n` 实现切换后组件自动重渲染

**Patterns to follow:**
- 设置页面中其他设置项的实现模式

**Test scenarios:**
- Happy path: 从 English 切换到 简体中文，整个应用的 UI 文本立即变为中文
- Happy path: 刷新页面后，语言偏好保留
- Edge case: 切换回 English，所有 UI 文本恢复为英文
- Integration: 与 U3-U6 提取的字符串配合，确保所有已迁移的文本都响应语言切换

**Verification:**
- 语言切换后所有已迁移组件自动刷新
- 关闭并重新打开应用，语言保持为上次选择

---

- U8. **提取消息与线程相关字符串**

**Goal:** 将消息渲染、线程列表/详情中的硬编码字符串迁移到 `messages` 和 `threads` 命名空间

**Requirements:** R2

**Dependencies:** U1

**Files:**
- Create: `src/locales/en/messages.json`
- Create: `src/locales/zh-CN/messages.json`
- Create: `src/locales/en/threads.json`
- Create: `src/locales/zh-CN/threads.json`
- Modify: `src/features/messages/` 下的相关文件（17 个）
- Modify: `src/features/threads/` 下的相关文件（70 个）

**Approach:**
- Threads 是第二大功能模块（70 文件），分步进行
- 先迁移直接的 UI 标签，再处理较复杂的动态文本
- 注意线程操作中的动词（"Create Thread"、"Delete"、"Rename"、"Archive"）
- 消息渲染中的状态文本（"Thinking..."、"Editing..."、"Tool call" 等）

**Test scenarios:**
- Happy path: 线程列表中的操作按钮显示中文翻译
- Happy path: 消息状态指示器（如 "Thinking..."）正确本地化
- Edge case: 插值语法（如 "Thread {name}"）正确替换参数
- Edge case: 复数形式（"1 message" vs "3 messages"）使用 i18next 复数能力处理

**Verification:**
- 线程管理和消息渲染功能正常，所有静态文本已本地化

---

- U9. **提取工作区、终端、Git 等剩余功能字符串**

**Goal:** 将工作区、终端、Git 集成等次要功能的硬编码字符串迁移到对应命名空间

**Requirements:** R2

**Dependencies:** U1, U8

**Files:**
- Create: `src/locales/en/workspaces.json`, `src/locales/zh-CN/workspaces.json`
- Create: `src/locales/en/terminal.json`, `src/locales/zh-CN/terminal.json`
- Create: `src/locales/en/git.json`, `src/locales/zh-CN/git.json`
- Create: `src/locales/en/composer.json`, `src/locales/zh-CN/composer.json`
- Create: `src/locales/en/app.json`, `src/locales/zh-CN/app.json`
- Create: `src/locales/en/notifications.json`, `src/locales/zh-CN/notifications.json`
- Create: `src/locales/en/files.json`, `src/locales/zh-CN/files.json`
- Create: `src/locales/en/prompts.json`, `src/locales/zh-CN/prompts.json`
- Create: `src/locales/en/models.json`, `src/locales/zh-CN/models.json`
- Create: `src/locales/en/about.json`, `src/locales/zh-CN/about.json`
- 以及可能需要新建的其他命名空间
- Modify: 各个功能目录下的对应 TSX 文件

**Approach:**
- 按功能模块逐个迁移
- 优先迁移用户经常交互的模块：composer（消息编辑器）、workspaces
- 低频模块（about、debug、update）放在后面

**Test scenarios:**
- Happy path: 每个功能模块的界面文本正确显示中文
- Edge case: 终端中的英语输出（如命令行返回）不应翻译
- Edge case: Git 命令输出中的技术术语保留原文

**Verification:**
- 所有功能模块正常运行，文本已本地化

---

- U10. **翻译质量审校与布局适配**

**Goal:** 对全部中文翻译进行审校，确保术语一致、语气恰当、无错译，并根据中文文本长度微调 UI 布局

**Requirements:** R3

**Dependencies:** U3, U4, U5, U6, U8, U9

**Files:**
- Modify: `src/locales/zh-CN/*.json`
- 可能修改: 相关 CSS 文件以适配中文文本长度

**Approach:**
- 统一术语表（如 "Thread" → "会话"、"Workspace" → "工作区"、"Settings" → "设置")
- 审查所有中文翻译是否自然、专业
- 检查中文文本可能溢出的 UI 元素，增加适当宽度或文字大小调整
- 特别关注按钮、标签、表格列头等空间有限的区域

**Test scenarios:**
- Happy path: 中文翻译全文覆盖，无遗漏翻译键
- Happy path: 术语在整个应用中保持一致
- Edge case: 所有受限空间的中文文本完整显示，无截断或溢出
- Integration: 在中文和英文下来回切换，所有界面完整渲染

**Verification:**
- 语言切换流畅无闪烁；中文翻译准确一致，无溢出

---

## System-Wide Impact

- **Interaction graph:** i18n 初始化在 `main.tsx` 入口处，影响全局渲染；`i18n.changeLanguage()` 触发所有 `useTranslation` hook 的重渲染
- **Error propagation:** 翻译键缺失时 i18next 默认返回键名本身，不会崩溃；通过 `i18next.failedLoading` 事件可捕获加载失败
- **State lifecycle risks:** 语言切换后组件状态不受影响（仅更新显示文本）；`localStorage` 持久化不存在竞争条件
- **Integration coverage:** 需要验证设计系统组件、功能组件在有/无 Suspense 边界的情况下均能正确响应语言切换
- **Unchanged invariants:** 所有内部状态、数据流、API 调用、IPC 通信路径不变；`Intl.NumberFormat` 和 `Intl.DateTimeFormat` 保留系统区域感知行为；Rust 后端的消息输出不变

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| 557 个文件全量迁移导致开发冻结过久 | 采用增量策略，每个命名空间一个独立 PR，不阻塞其他开发 |
| 动态字符串（拼接的英文短语）迁移时可能遗漏 | 引入正则扫描工具辅助查找硬编码字符串 |
| 中文字符串长度比英文长，可能导致 UI 截断 | U10 专项处理；现有 layout 足够宽裕则风险较小 |
| react-i18next 与 React 19 的 Suspense 交互 | i18next 26.x 已兼容 React 19；关闭 `useSuspense` 作为备选 |

---

## Documentation / Operational Notes

- 所有翻译键使用点分隔命名法（如 `modal.close`、`sidebar.settings`），保持一致性
- 英文 JSON 作为源文本，中文 JSON 提供对应翻译
- 后续添加新语言只需新建 `src/locales/{lng}/` 目录并翻译 JSON 文件
- 新功能开发时，直接将新字符串写入对应的命名空间 JSON 文件，用 `t()` 函数引用
- 语言切换 UI 放置在设置页面，无需额外的 Tauri 权限申请

---

## Sources & References

- **react-i18next 库文档:** https://react.i18next.com/
- **i18next 库文档:** https://www.i18next.com/
- **i18next-browser-languagedetector:** https://github.com/i18next/i18next-browser-languageDetector
- 相关代码: `src/features/*/` 下全部 TSX 文件
