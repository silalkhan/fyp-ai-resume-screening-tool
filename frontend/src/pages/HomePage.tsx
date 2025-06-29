import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getJobCategories } from "../services/api";
import { JobCategory } from "../types";

const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getJobCategories();
        if (response.success) {
          setCategories(response.data);
        } else {
          setError(response.message || "Failed to fetch job categories");
        }
      } catch (error) {
        console.error("Error fetching job categories", error);
        setError(
          "Unable to connect to the server. Please make sure the backend service is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-md rounded-lg transition-all hover:shadow-lg">
            <div className="px-4 py-5 sm:p-6">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Our AI-powered system analyzes your resume against job
                requirements to determine the best match for your skills and
                experience.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
            How It Works
          </h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold shadow-sm">
                1
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                  Select a Job Category
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Browse through available job categories and positions.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold shadow-sm">
                2
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                  Upload Your Resume
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Upload your resume in PDF or DOCX format.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold shadow-sm">
                3
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                  Get Your Results
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Our AI analyzes your resume and provides a match score. If
                  your score is high enough, you may be shortlisted!
                </p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Available Job Categories
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div
            className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-4 rounded-r-md shadow-sm"
            role="alert"
          >
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mt-4">
              No job categories found
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Please make sure the backend server is running and has job
              categories configured.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/jobs/${category.id}`}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-t-4 border-primary-500"
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {category.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {category.description}
                </p>
                <div className="mt-4 text-primary-600 dark:text-primary-400 font-medium flex items-center">
                  View Jobs
                  <svg
                    className="ml-1 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;
