import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 mt-auto border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="flex items-center">
            <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">
              AI Resume Screening Tool
            </span>
            <span className="text-sm ml-2 text-gray-400 dark:text-gray-500">
              AI-Powered Analysis
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            &copy; {currentYear} AI Resume Screening Tool. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
