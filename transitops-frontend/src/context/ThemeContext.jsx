import { useEffect } from "react";

export function ThemeProvider({
  children,
}) {
  useEffect(() => {
  document.body.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
  }, []);

  return children;
}