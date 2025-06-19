import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
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
    <Layout title={getCategoryName()}>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <p className="mt-2">
            Make sure the backend service is running and properly configured.
          </p>
        </div>
      ) : jobDescriptions.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-600">
            No job descriptions found
          </h2>
          <p className="mt-2 text-gray-500">
            No job descriptions are available for this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Available Positions
              </h2>
              <div className="space-y-2">
                {jobDescriptions.map((job) => (
                  <button
                    key={job._id}
                    className={`block w-full text-left px-4 py-2 rounded-md transition ${
                      selectedJob?._id === job._id
                        ? "bg-primary-100 text-primary-800"
                        : "hover:bg-gray-100"
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
                <div className="card mb-6">
                  <h2 className="text-2xl font-bold mb-4">
                    {selectedJob.title}
                  </h2>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-line">
                      {selectedJob.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Required Skills
                      </h3>
                      <ul className="list-disc pl-5 text-gray-700">
                        {selectedJob.requiredSkills &&
                          selectedJob.requiredSkills.map((skill, index) => (
                            <li key={index}>{skill}</li>
                          ))}
                      </ul>
                    </div>

                    {selectedJob.preferredSkills &&
                      selectedJob.preferredSkills.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Preferred Skills
                          </h3>
                          <ul className="list-disc pl-5 text-gray-700">
                            {selectedJob.preferredSkills.map((skill, index) => (
                              <li key={index}>{skill}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>

                  <div className="text-sm text-gray-500">
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
    </Layout>
  );
};

export default JobDescriptionPage;
