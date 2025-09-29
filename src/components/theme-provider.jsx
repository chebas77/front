import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "../contexts/theme-context";

function resolveInitialTheme(defaultTheme) {
  if (typeof window === "undefined") {
    return defaultTheme;
  }
  return localStorage.getItem("theme") || defaultTheme;
}

export function ThemeProvider({ children, defaultTheme = "light" }) {
  const [theme, setTheme] = useState(() => resolveInitialTheme(defaultTheme));
  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
