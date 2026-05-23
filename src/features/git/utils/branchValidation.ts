import i18n from "@/locales/i18n";

export function validateBranchName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed === "." || trimmed === "..") {
    return i18n.t("git:branchNameDot");
  }
  if (/\s/.test(trimmed)) {
    return i18n.t("git:branchNameSpaces");
  }
  if (trimmed.startsWith("/") || trimmed.endsWith("/")) {
    return i18n.t("git:branchNameSlash");
  }
  if (trimmed.includes("//")) {
    return i18n.t("git:branchNameDoubleSlash");
  }
  if (trimmed.endsWith(".lock")) {
    return i18n.t("git:branchNameLock");
  }
  if (trimmed.includes("..")) {
    return i18n.t("git:branchNameDoubleDot");
  }
  if (trimmed.includes("@{")) {
    return i18n.t("git:branchNameAt");
  }
  const invalidChars = ["~", "^", ":", "?", "*", "[", "\\"];
  if (invalidChars.some((char) => trimmed.includes(char))) {
    return i18n.t("git:branchNameInvalidChars");
  }
  if (trimmed.endsWith(".")) {
    return i18n.t("git:branchNameEndDot");
  }
  return null;
}
