import { isMacPlatform as isMacPlatformFromPaths } from "./platformPaths";
import i18n from "../locales/i18n";

export type ShortcutDefinition = {
  key: string;
  meta: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
};

function normalizeShortcutDefinitionForPlatform(
  value: ShortcutDefinition,
  isMac: boolean,
): ShortcutDefinition {
  if (isMac) {
    return value;
  }
  if (value.meta && value.ctrl) {
    return { ...value, meta: false, alt: true };
  }
  return value;
}

const MODIFIER_ORDER = ["cmd", "ctrl", "alt", "shift"] as const;
const MODIFIER_LABELS_MAC: Record<string, string> = {
  cmd: "⌘",
  ctrl: "⌃",
  alt: "⌥",
  shift: "⇧",
};

const MODIFIER_LABELS_OTHER: Record<string, string> = {
  cmd: "Ctrl",
  ctrl: "Ctrl",
  alt: "Alt",
  shift: "Shift",
};

const ACCELERATOR_KEYS: Record<string, string> = {
  " ": "Space",
  space: "Space",
  escape: "Esc",
  esc: "Esc",
  enter: "Enter",
  return: "Enter",
  tab: "Tab",
  backspace: "Backspace",
  delete: "Delete",
  arrowup: "Up",
  arrowdown: "Down",
  arrowleft: "Left",
  arrowright: "Right",
};

const MODIFIER_KEYS = new Set(["shift", "control", "alt", "meta"]);

function normalizeKey(key: string) {
  const normalized = key.toLowerCase();
  if (MODIFIER_KEYS.has(normalized)) {
    return null;
  }
  if (normalized === " ") {
    return "space";
  }
  return normalized;
}

export function parseShortcut(value: string | null | undefined): ShortcutDefinition | null {
  if (!value) {
    return null;
  }
  const parts = value
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  if (parts.length === 0) {
    return null;
  }
  const key = parts[parts.length - 1] ?? "";
  if (!key || MODIFIER_KEYS.has(key)) {
    return null;
  }
  return {
    key,
    meta: parts.includes("cmd") || parts.includes("meta"),
    ctrl: parts.includes("ctrl") || parts.includes("control"),
    alt: parts.includes("alt") || parts.includes("option"),
    shift: parts.includes("shift"),
  };
}

export function formatShortcut(value: string | null | undefined): string {
  if (!value) {
    return i18n.t("shortcuts.formatNotSet", { ns: "settings" });
  }
  const parsed = parseShortcut(value);
  if (!parsed) {
    return value;
  }
  const useSymbols = isMacPlatform();
  const normalized = normalizeShortcutDefinitionForPlatform(parsed, useSymbols);
  const modifierLabels = useSymbols ? MODIFIER_LABELS_MAC : MODIFIER_LABELS_OTHER;
  const getModifierLabel = (modifier: string, label: string) => {
    if (useSymbols) return label;
    const key = `shortcuts.mod${modifier.charAt(0).toUpperCase() + modifier.slice(1)}`;
    return i18n.t(key, { ns: "settings", defaultValue: label });
  };
  const modifiers = MODIFIER_ORDER.flatMap((modifier) => {
    if (modifier === "cmd" && normalized.meta) {
      return getModifierLabel(modifier, modifierLabels.cmd);
    }
    if (modifier === "ctrl" && normalized.ctrl) {
      return getModifierLabel(modifier, modifierLabels.ctrl);
    }
    if (modifier === "alt" && normalized.alt) {
      return getModifierLabel(modifier, modifierLabels.alt);
    }
    if (modifier === "shift" && normalized.shift) {
      return getModifierLabel(modifier, modifierLabels.shift);
    }
    return [];
  });
  const uniqueModifiers = useSymbols
    ? modifiers
    : modifiers.filter((modifier, index) => modifiers.indexOf(modifier) === index);
  const keyLabel =
    getLocalizedKeyLabel(parsed.key) ??
    (parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key);
  return useSymbols
    ? [...uniqueModifiers, keyLabel].join("")
    : [...uniqueModifiers, keyLabel].join("+");
}

function getLocalizedKeyLabel(key: string): string | undefined {
  const KEY_I18N_MAP: Record<string, string> = {
    " ": "Space",
    space: "Space",
    escape: "Esc",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
  };
  const KEY_I18N_KEY: Record<string, string> = {
    " ": "keySpace",
    space: "keySpace",
    escape: "keyEsc",
  };
  const defaultLabel = KEY_I18N_MAP[key];
  if (!defaultLabel) {
    return undefined;
  }
  const i18nKey = KEY_I18N_KEY[key];
  if (i18nKey) {
    return i18n.t(`shortcuts.${i18nKey}`, { ns: "settings", defaultValue: defaultLabel });
  }
  // Arrow symbols and other universal labels don't need translation
  return defaultLabel;
}

export function buildShortcutValue(event: KeyboardEvent): string | null {
  const key = normalizeKey(event.key);
  if (!key) {
    return null;
  }
  const hasPrimaryModifier = event.metaKey || event.ctrlKey || event.altKey;
  const allowShiftOnly = event.shiftKey && key === "tab";
  if (!hasPrimaryModifier && !allowShiftOnly) {
    return null;
  }
  const modifiers = [];
  if (event.metaKey) {
    modifiers.push("cmd");
  }
  if (event.ctrlKey) {
    modifiers.push("ctrl");
  }
  if (event.altKey) {
    modifiers.push("alt");
  }
  if (event.shiftKey) {
    modifiers.push("shift");
  }
  return [...modifiers, key].join("+");
}

export function matchesShortcut(event: KeyboardEvent, value: string | null | undefined): boolean {
  const parsed = parseShortcut(value);
  if (!parsed) {
    return false;
  }
  const isMac = isMacPlatform();
  const normalized = normalizeShortcutDefinitionForPlatform(parsed, isMac);
  const key = normalizeKey(event.key);
  if (!key || key !== normalized.key) {
    return false;
  }
  const metaMatches = normalized.meta
    ? isMac
      ? event.metaKey
      : event.ctrlKey || event.metaKey
    : !event.metaKey;
  if (!metaMatches) {
    return false;
  }

  const ctrlMatches = normalized.ctrl
    ? event.ctrlKey
    : normalized.meta && !isMac
      ? true
      : !event.ctrlKey;
  return (
    ctrlMatches &&
    normalized.alt === event.altKey &&
    normalized.shift === event.shiftKey
  );
}

export function isMacPlatform(): boolean {
  return isMacPlatformFromPaths();
}

export function getDefaultInterruptShortcut(): string {
  return isMacPlatform() ? "ctrl+c" : "ctrl+shift+c";
}

export function toMenuAccelerator(value: string | null | undefined): string | null {
  const parsed = parseShortcut(value);
  if (!parsed) {
    return null;
  }
  const isMac = isMacPlatform();
  const normalized = normalizeShortcutDefinitionForPlatform(parsed, isMac);
  const parts: string[] = [];
  if (normalized.meta && normalized.ctrl) {
    parts.push("Cmd");
    parts.push("Ctrl");
  } else if (normalized.meta) {
    parts.push("CmdOrCtrl");
  } else if (normalized.ctrl) {
    parts.push("Ctrl");
  }
  if (normalized.alt) {
    parts.push("Alt");
  }
  if (normalized.shift) {
    parts.push("Shift");
  }
  const key =
    ACCELERATOR_KEYS[normalized.key] ??
    (normalized.key.length === 1 ? normalized.key.toUpperCase() : normalized.key);
  if (!key) {
    return null;
  }
  return [...parts, key].join("+");
}
