import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isAdminSection =
    location.pathname.includes("/admin") ||
    location.pathname.includes("/jobs/manage") ||
    location.pathname.includes("/resumes/all");

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 z-20 m-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 w-64 bg-gray-800 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto z-20`}
      >
        <div className="p-6">
          <Link to="/" className="text-white text-2xl font-bold">
            Resume Screening
          </Link>
          <div className="text-gray-400 text-sm">AI-Driven Analysis</div>
        </div>

        <nav className="mt-6">
          <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider">
            Candidate View
          </div>
          <Link
            to="/"
            className={`flex items-center px-6 py-3 hover:bg-gray-700 ${
              isActive("/") ? "bg-gray-700" : ""
            }`}
            onClick={() => setIsOpen(false)}
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Home
          </Link>
          <Link
            to="/jobs/Web%20Developer"
            className={`flex items-center px-6 py-3 hover:bg-gray-700 ${
              location.pathname.startsWith("/jobs/") &&
              !location.pathname.includes("/manage")
                ? "bg-gray-700"
                : ""
            }`}
            onClick={() => setIsOpen(false)}
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Browse Jobs
          </Link>

          <hr className="my-4 border-gray-700" />

          <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider">
            Admin View
          </div>
          <Link
            to="/jobs/manage"
            className={`flex items-center px-6 py-3 hover:bg-gray-700 ${
              isActive("/jobs/manage") ? "bg-gray-700" : ""
            }`}
            onClick={() => setIsOpen(false)}
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Manage Jobs
          </Link>
          <Link
            to="/resumes/all"
            className={`flex items-center px-6 py-3 hover:bg-gray-700 ${
              isActive("/resumes/all") ? "bg-gray-700" : ""
            }`}
            onClick={() => setIsOpen(false)}
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            All Resumes
          </Link>

          <div className="mt-auto pt-4 pb-2 px-6">
            <div
              className={`p-3 rounded-lg ${
                isAdminSection ? "bg-blue-700" : "bg-green-700"
              }`}
            >
              <div className="text-sm font-medium">
                Current Mode: {isAdminSection ? "Admin" : "Candidate"}
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
