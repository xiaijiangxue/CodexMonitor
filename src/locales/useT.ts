import { useTranslation } from "react-i18next";
import type { Namespace } from "./types";

export function useT(ns: Namespace) {
  return useTranslation(ns);
}

export function useCommon() {
  return useTranslation("common");
}

export function useLayout() {
  return useTranslation("layout");
}
