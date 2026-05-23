import { useTranslation } from "react-i18next";

export function LanguageSetting() {
  const { i18n } = useTranslation();

  return (
    <div className="settings-field">
      <label className="settings-field-label" htmlFor="language-select">
        Language / 语言
      </label>
      <select
        id="language-select"
        className="settings-select"
        value={i18n.language}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
      >
        <option value="en">English</option>
        <option value="zh-CN">简体中文</option>
      </select>
    </div>
  );
}
