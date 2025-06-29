import React from "react";
import { useDarkMode } from "../../context/DarkModeContext";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

const DarkModeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? (
        <SunIcon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <MoonIcon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
};

export default DarkModeToggle;
