import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ResumeUpload from "../components/resume/ResumeUpload";
import { getJobDescriptions } from "../services/api";
import { JobDescription } from "../types";

const JobDescriptionPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        console.log("Fetching jobs for category:", categoryId);
        setLoading(true);
        setError(null);
        const response = await getJobDescriptions(categoryId);
        console.log("API response:", response);

        if (response.success) {
          setJobDescriptions(response.data || []);
          if (response.data && response.data.length > 0) {
            setSelectedJob(response.data[0]);
          } else {
            console.log("No job descriptions found in response");
          }
        } else {
          setError(response.message || "Failed to fetch job descriptions");
          console.error("API error:", response.message);
        }
      } catch (err) {
        console.error("Error fetching job descriptions", err);
        setError(
          "Unable to connect to the server. Please make sure the backend service is running."
        );
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchJobs();
    } else {
      console.error("No categoryId provided");
      setError("Invalid category ID");
      setLoading(false);
    }
  }, [categoryId]);

  // Get category name from categoryId (would be more robust with a central mapping or api call)
  const getCategoryName = () => {
    switch (categoryId) {
      case "Cybersecurity":
        return "Cybersecurity";
      case "Web Developer":
        return "Web Developer";
      case "UET Peshawar":
        return "Lecturer at UET Peshawar";
      case "Python Developer":
        return "Python Developer";
      case "Software Engineer":
        return "Software Engineer";
      default:
        return "Job Listings";
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {getCategoryName()}
      </h1>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div
          className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-4 rounded transition-colors duration-300"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <p className="mt-2">
            Make sure the backend service is running and properly configured.
          </p>
        </div>
      ) : jobDescriptions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-lg text-center transition-colors duration-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            No job descriptions found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No job descriptions are available for this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 shadow dark:shadow-lg rounded-lg p-6 mb-6 transition-colors duration-300">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                Available Positions
              </h2>
              <div className="space-y-2">
                {jobDescriptions.map((job) => (
                  <button
                    key={job._id}
                    className={`block w-full text-left px-4 py-2 rounded-md transition-colors duration-200 ${
                      selectedJob?._id === job._id
                        ? "bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                    }`}
                    onClick={() => {
                      console.log("Selected job:", job);
                      setSelectedJob(job);
                    }}
                  >
                    {job.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedJob && (
              <>
                <div className="bg-white dark:bg-gray-800 shadow dark:shadow-lg rounded-lg p-6 mb-6 transition-colors duration-300">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                    {selectedJob.title}
                  </h2>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                      Description
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {selectedJob.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                        Required Skills
                      </h3>
                      <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                        {selectedJob.requiredSkills &&
                          selectedJob.requiredSkills.map((skill, index) => (
                            <li key={index}>{skill}</li>
                          ))}
                      </ul>
                    </div>

                    {selectedJob.preferredSkills &&
                      selectedJob.preferredSkills.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                            Preferred Skills
                          </h3>
                          <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                            {selectedJob.preferredSkills.map((skill, index) => (
                              <li key={index}>{skill}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedJob.requiredExperience > 0 ? (
                      <p>
                        Experience Required: {selectedJob.requiredExperience}{" "}
                        year(s)
                      </p>
                    ) : (
                      <p>No prior experience required</p>
                    )}
                  </div>
                </div>

                <ResumeUpload jobDescription={selectedJob} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default JobDescriptionPage;
