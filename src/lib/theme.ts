export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "wequiz-theme";

/**
 * Inline script run before first paint: applies the stored theme, or the OS
 * preference when nothing is stored, to avoid a flash of the wrong theme.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})();`;
