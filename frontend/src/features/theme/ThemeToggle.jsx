import { useTheme } from "./theme.context";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const nextTheme = theme === "light" ? "dark" : "light";

    return (
        <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === "dark"}
            aria-label={`Switch to ${nextTheme} mode`}
            title={`Switch to ${nextTheme} mode`}
        >
            <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
            <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
        </button>
    );
}
