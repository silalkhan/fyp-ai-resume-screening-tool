import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllResumes, deleteResume } from "../services/api";
import { Resume } from "../types";
import { toast } from "react-toastify";

const AllResumesPage: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const navigate = useNavigate();

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllResumes();
      if (response.success) {
        setResumes(response.data);
      } else {
        setError(response.message || "Failed to fetch resumes");
      }
    } catch (err) {
      console.error("Error fetching resumes:", err);
      setError(
        "Unable to connect to the server. Please make sure the backend service is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleViewDetails = (resume: Resume) => {
    setSelectedResume(resume);
    setShowModal(true);
  };

  const handleViewProcessing = (resumeId: string) => {
    navigate(`/resumes/${resumeId}/processing`);
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (window.confirm("Are you sure you want to delete this resume?")) {
      try {
        const response = await deleteResume(resumeId);
        if (response.success) {
          toast.success("Resume deleted successfully");
          fetchResumes(); // Refresh the resume list
        } else {
          toast.error(response.message || "Failed to delete resume");
        }
      } catch (error) {
        console.error("Error deleting resume:", error);
        toast.error("An error occurred while deleting the resume");
      }
    }
  };

  // Helper functions
  const formatFileSize = (size: number | undefined): string => {
    if (!size) return "0 KB";
    return `${(size / 1024).toFixed(2)} KB`;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getFileType = (mimeType: string | undefined): string => {
    if (!mimeType) return "Unknown";
    if (mimeType.includes("pdf")) return "PDF";
    if (mimeType.includes("word") || mimeType.includes("docx"))
      return "Word Document";
    return mimeType;
  };

  const renderModal = () => {
    if (!selectedResume || !showModal) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Resume Details</h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* File Information */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-2">File Information</h3>
              <p>
                <span className="font-medium">File Name:</span>{" "}
                {selectedResume.originalFilename ||
                  selectedResume.fileName ||
                  "Unnamed"}
              </p>
              <p>
                <span className="font-medium">File Type:</span>{" "}
                {getFileType(selectedResume.mimeType)}
              </p>
              <p>
                <span className="font-medium">File Size:</span>{" "}
                {formatFileSize(selectedResume.fileSize)}
              </p>
              <p>
                <span className="font-medium">Upload Date:</span>{" "}
                {formatDate(selectedResume.uploadDate)}
              </p>
            </div>

            {/* Contact Information */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-2">
                Contact Information
              </h3>
              <p>
                <span className="font-medium">Name:</span>{" "}
                {selectedResume.candidateName || "Not detected"}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {selectedResume.contactInfo?.email || "Not detected"}
              </p>
              <p>
                <span className="font-medium">Phone:</span>{" "}
                {selectedResume.contactInfo?.phone || "Not detected"}
              </p>
              {selectedResume.contactInfo?.location && (
                <p>
                  <span className="font-medium">Location:</span>{" "}
                  {selectedResume.contactInfo.location}
                </p>
              )}
            </div>

            {/* Processing Status */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-2">Processing Status</h3>
              <p>
                <span className="font-medium">Status:</span>{" "}
                {selectedResume.processed ? (
                  <span className="text-green-600">Processed</span>
                ) : (
                  <span className="text-yellow-600">Processing</span>
                )}
              </p>
              {selectedResume.matchScore !== undefined && (
                <p>
                  <span className="font-medium">Match Score:</span>{" "}
                  {selectedResume.matchScore}%
                </p>
              )}
              <p>
                <span className="font-medium">Shortlisted:</span>{" "}
                {selectedResume.shortlisted ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-red-600">No</span>
                )}
              </p>
            </div>

            {/* Skills */}
            {selectedResume.processedData?.skills &&
              selectedResume.processedData.skills.length > 0 && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-2">
                    Detected Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedResume.processedData?.skills.map(
                      (skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => setShowModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowModal(false);
                handleViewProcessing(selectedResume._id);
              }}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              View Full Results
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">All Resumes</h1>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <p className="mt-2">
            Please make sure the backend service is running and try again.
          </p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No Resumes Found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Looks like no resumes have been uploaded yet.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Upload New Resume
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Uploaded Resumes</h2>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Upload New Resume
            </Link>
          </div>

          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Job Position
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Match Score
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Upload Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resumes.map((resume) => (
                    <tr key={resume._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {resume.candidateName || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {resume.jobDescriptionId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            (resume.matchScore || 0) >= 70
                              ? "bg-green-100 text-green-800"
                              : (resume.matchScore || 0) >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {resume.matchScore || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            resume.processed
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {resume.processed ? "Processed" : "Processing"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(resume.uploadDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(resume)}
                          className="text-primary-600 hover:text-primary-900 mr-2"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleViewProcessing(resume._id)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          Results
                        </button>
                        <button
                          onClick={() => handleDeleteResume(resume._id)}
                          className="text-red-600 hover:text-red-900"
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
        </div>
      )}
      {renderModal()}
    </>
  );
};

export default AllResumesPage;
