import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useDarkMode } from "../../context/DarkModeContext";

interface LayoutProps {
  children?: React.ReactNode;
  title?: string;
  servicesStatus?: {
    backend: boolean;
    nlp: boolean;
  };
}

const Layout: React.FC<LayoutProps> = ({ children, title, servicesStatus }) => {
  const { darkMode } = useDarkMode();

  return (
    <div
      className={`flex flex-col min-h-screen ${
        darkMode ? "dark bg-gray-900" : "bg-gray-50"
      } transition-colors duration-300`}
    >
      <Navbar servicesStatus={servicesStatus} />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {title && (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {title}
            </h1>
          )}
          {children || <Outlet />}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
