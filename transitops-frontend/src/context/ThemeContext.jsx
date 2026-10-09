import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

const ThemeContext =
  createContext();

export function ThemeProvider({
  children,
}) {
  const [darkMode, setDarkMode] =
    useState(false);

  useEffect(() => {
    const saved =
      localStorage.getItem("theme");

    if (saved === "dark") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    document.body.className =
      darkMode ? "dark" : "";

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  const toggleTheme = () =>
    setDarkMode(!darkMode);

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () =>
  useContext(ThemeContext);