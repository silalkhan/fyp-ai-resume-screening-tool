import React from "react";
import { Link, useLocation } from "react-router-dom";
import Layout from "../components/layout/Layout";

const ErrorPage: React.FC = () => {
  const location = useLocation();
  const { message, code } =
    (location.state as {
      message?: string;
      code?: number;
    }) || {};

  return (
    <Layout title="Error">
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {code ? `Error ${code}` : "Something went wrong"}
          </h2>
          <p className="text-lg">
            {message ||
              "We encountered an error while processing your request."}
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Possible solutions:</h3>
            <ul className="list-disc pl-5 space-y-2 text-left">
              <li>Make sure both the backend and NLP services are running</li>
              <li>Check your internet connection</li>
              <li>Try refreshing the page</li>
              <li>Clear your browser cache and cookies</li>
              <li>Try again later</li>
            </ul>
          </div>

          <div className="flex justify-center space-x-4">
            <Link
              to="/"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
            >
              Go to Homepage
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ErrorPage;
