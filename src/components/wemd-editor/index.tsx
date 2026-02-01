// WeMD Editor 公共入口
// 组件
export { Header } from "./components/Header/Header";
export { MarkdownEditor } from "./components/Editor/MarkdownEditor";
export { Toolbar } from "./components/Editor/Toolbar";
export { MarkdownPreview } from "./components/Preview/MarkdownPreview";
export { ThemePanel } from "./components/Theme/ThemePanel";

// Store Hooks
export { useEditorStore } from "./store/editorStore";
export { useThemeStore, builtInThemes } from "./store/themeStore";
export { useHistoryStore } from "./store/historyStore";

// Core
export { createMarkdownParser, processHtml } from "./core";

// Hooks
export { useUITheme } from "./hooks/useUITheme";
export { useMobileView } from "./hooks/useMobileView";

// Utilities
export { countWords, countLines } from "./utils/wordCount";
