import React, { createContext, useState, useContext, useEffect } from "react";

interface DarkModeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
});

export const useDarkMode = () => useContext(DarkModeContext);

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Check for user preference in localStorage or system preference
  const [darkMode, setDarkMode] = useState(() => {
    // First check localStorage
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      return savedMode === "true";
    }

    // Otherwise check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Add dark mode class to document if enabled
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Save preference to localStorage
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  // Toggle function
  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};
