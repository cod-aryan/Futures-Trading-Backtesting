"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "theme";

/**
 * Theme hook: manages dark/light theme with localStorage persistence.
 * Applies `data-theme` attribute to <html>.
 */
export default function useTheme() {
  const [theme, setThemeState] = useState("dark");

  // Initialize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = saved === "light" ? "light" : "dark";
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const isDark = theme === "dark";

  return { theme, isDark, toggleTheme, setTheme };
}
