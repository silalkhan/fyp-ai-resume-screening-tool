import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getAllResumes,
  getJobDescriptions,
  deleteResume,
  deleteJobDescription,
} from "../services/api";
import { Card } from "../components/ui/Card";
import { Resume, JobDescription } from "../types";
import { toast } from "react-toastify";

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "resumes" | "jobs">(
    "dashboard"
  );
  const [resumesCount, setResumesCount] = useState<number>(0);
  const [jobsCount, setJobsCount] = useState<number>(0);
  const [shortlistedCount, setShortlistedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<JobDescription[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch resumes
        const resumesResponse = await getAllResumes();
        if (resumesResponse.success) {
          setResumes(resumesResponse.data);
          setResumesCount(resumesResponse.data.length);
          // Count shortlisted resumes
          const shortlisted = resumesResponse.data.filter(
            (resume: Resume) => resume.shortlisted
          ).length;
          setShortlistedCount(shortlisted);
        }

        // Fetch jobs
        const jobsResponse = await getJobDescriptions();
        if (jobsResponse.success) {
          setJobs(jobsResponse.data);
          setJobsCount(jobsResponse.data.length);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteResume = async (resumeId: string) => {
    if (window.confirm("Are you sure you want to delete this resume?")) {
      try {
        const response = await deleteResume(resumeId);
        if (response.success) {
          toast.success("Resume deleted successfully");
          // Update local state
          setResumes((prevResumes) =>
            prevResumes.filter((resume) => resume._id !== resumeId)
          );
          setResumesCount((prev) => prev - 1);
        } else {
          toast.error(response.message || "Failed to delete resume");
        }
      } catch (error) {
        console.error("Error deleting resume:", error);
        toast.error("An error occurred while deleting the resume");
      }
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (
      window.confirm("Are you sure you want to delete this job description?")
    ) {
      try {
        const response = await deleteJobDescription(jobId);
        if (response.success) {
          toast.success("Job description deleted successfully");
          // Update local state
          setJobs((prevJobs) => prevJobs.filter((job) => job._id !== jobId));
          setJobsCount((prev) => prev - 1);
        } else {
          toast.error(response.message || "Failed to delete job description");
        }
      } catch (error) {
        console.error("Error deleting job:", error);
        toast.error("An error occurred while deleting the job description");
      }
    }
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex flex-col items-center p-6">
            <h2 className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              {resumesCount}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
              Total Resumes
            </p>
            <button
              onClick={() => setActiveTab("resumes")}
              className="mt-4 text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
            >
              View All Resumes
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col items-center p-6">
            <h2 className="text-4xl font-bold text-green-600 dark:text-green-400">
              {shortlistedCount}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
              Shortlisted
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {resumesCount > 0
                ? `${Math.round(
                    (shortlistedCount / resumesCount) * 100
                  )}% success rate`
                : "No resumes yet"}
            </p>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col items-center p-6">
            <h2 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {jobsCount}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
              Job Positions
            </p>
            <button
              onClick={() => setActiveTab("jobs")}
              className="mt-4 text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Manage Jobs
            </button>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 shadow dark:shadow-lg rounded-lg p-6 transition-colors duration-300">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
          >
            Upload New Resume
          </Link>

          <button
            onClick={() => {
              setActiveTab("jobs");
              navigate("/jobs/manage");
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Add New Job
          </button>

          <button
            onClick={() => setActiveTab("resumes")}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Review Resumes
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 shadow dark:shadow-lg rounded-lg p-6 transition-colors duration-300">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          System Information
        </h2>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Version:</span> 1.0.0
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Last Updated:</span>{" "}
            {new Date().toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Environment:</span> Development
          </p>
        </div>
      </div>
    </div>
  );

  const renderResumes = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Resume Management
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
          <Link
            to="/"
            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
          >
            Upload New Resume
          </Link>
        </div>
      </div>

      {resumes.length === 0 ? (
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
            No Resumes Found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Looks like no resumes have been uploaded yet.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow dark:shadow-lg overflow-hidden rounded-lg transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Job Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Match Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {resumes.map((resume) => (
                  <tr
                    key={resume._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      {resume.candidateName || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      {resume.jobDescriptionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          (resume.matchScore || 0) >= 70
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : (resume.matchScore || 0) >= 50
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {resume.matchScore || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          resume.processed
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {resume.processed ? "Processed" : "Processing"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      {formatDate(resume.uploadDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() =>
                          navigate(`/resumes/${resume._id}/processing`)
                        }
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-2"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteResume(resume._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Job Management
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
          <Link
            to="/jobs/manage"
            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
          >
            Add New Job
          </Link>
        </div>
      </div>

      {jobs.length === 0 ? (
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
            No Jobs Found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No job descriptions have been created yet.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow dark:shadow-lg overflow-hidden rounded-lg transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Required Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Required Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {jobs.map((job) => (
                  <tr
                    key={job._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      {job.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      {job.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      {job.requiredExperience > 0
                        ? `${job.requiredExperience} year(s)`
                        : "None"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {job.requiredSkills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.requiredSkills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs rounded-full">
                            +{job.requiredSkills.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/jobs/manage?edit=${job._id}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteJob(job._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "resumes":
        return renderResumes();
      case "jobs":
        return renderJobs();
      default:
        return renderDashboard();
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Admin Dashboard
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === "dashboard"
                ? "bg-primary-600 text-white dark:bg-primary-700"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("resumes")}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === "resumes"
                ? "bg-primary-600 text-white dark:bg-primary-700"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            }`}
          >
            Resumes
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === "jobs"
                ? "bg-primary-600 text-white dark:bg-primary-700"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            }`}
          >
            Jobs
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      ) : (
        renderContent()
      )}
    </>
  );
};

export default AdminDashboardPage;
