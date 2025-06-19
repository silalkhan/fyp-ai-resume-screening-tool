import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ResumeResults from "../components/resume/ResumeResults";
import { getResumeById, checkProcessingStatus } from "../services/api";
import { Resume } from "../types";
import { processResumeData } from "../utils/resumeDataProcessor";

const MAX_POLL_ATTEMPTS = 30; // 5 minutes total with 10s intervals
const INITIAL_POLL_INTERVAL = 5000; // Start with 5 second intervals
const MAX_POLL_INTERVAL = 10000; // Max 10 second intervals

const ResumeProcessingPage: React.FC = () => {
  const { resumeId: routeResumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<
    "pending" | "completed" | "failed"
  >("pending");
  const [pollCount, setPollCount] = useState<number>(0);

  // Defensive: log and check resumeId
  useEffect(() => {
    console.log("[ResumeProcessingPage] routeResumeId:", routeResumeId);
  }, [routeResumeId]);

  const pollTaskStatus = useCallback(
    async (taskId: string) => {
      try {
        if (!taskId) {
          throw new Error("Task ID is required for checking processing status");
        }

        if (pollCount >= MAX_POLL_ATTEMPTS) {
          throw new Error(
            "Resume processing is taking longer than expected. Please check back later."
          );
        }

        console.log(
          `Polling task status for taskId ${taskId} (attempt ${
            pollCount + 1
          }/${MAX_POLL_ATTEMPTS})...`
        );

        const response = await checkProcessingStatus(taskId);
        console.log("Processing status response:", response);

        if (!response || typeof response.status !== "string") {
          throw new Error("Invalid response from processing status check");
        }

        if (response.status === "completed") {
          console.log("Processing completed, fetching updated resume data...");

          const updatedResumeResponse = await getResumeById(
            routeResumeId as string
          );
          console.log("Updated resume response:", updatedResumeResponse);

          if (!updatedResumeResponse.success || !updatedResumeResponse.data) {
            throw new Error(
              updatedResumeResponse.message ||
                "Failed to retrieve processed resume data. Please try again."
            );
          }

          if (!updatedResumeResponse.data.processedData) {
            throw new Error(
              "Resume processing completed but results were not found. Please try uploading again."
            );
          }

          // Ensure all required fields are present
          const updatedResumeData = {
            ...updatedResumeResponse.data,
            taskId: taskId,
            processed: true,
            processing: false,
            processingError: null,
          };

          const processedResume = processResumeData(updatedResumeData);
          console.log("Processed resume after completion:", processedResume);
          setResume(processedResume);
          setProcessingStatus("completed");
          setLoading(false);
          return;
        }

        if (response.status === "failed") {
          throw new Error(response.error || "Processing failed");
        }

        // Still processing, continue polling
        const pollInterval = Math.min(
          INITIAL_POLL_INTERVAL * Math.pow(1.5, pollCount),
          MAX_POLL_INTERVAL
        );
        setPollCount((prev) => prev + 1);
        setTimeout(() => pollTaskStatus(taskId), pollInterval);
      } catch (err: any) {
        console.error("Error checking task status:", err);
        setError(err.message || "Failed to process resume. Please try again.");
        setProcessingStatus("failed");
        setLoading(false);
      }
    },
    [routeResumeId, pollCount]
  );

  useEffect(() => {
    const fetchResume = async () => {
      setLoading(true);
      setError(null);
      let resumeId = routeResumeId;
      if (!resumeId) {
        setError("No resume ID provided in URL. Please return and try again.");
        setLoading(false);
        return;
      }
      try {
        console.log(
          "[ResumeProcessingPage] Fetching resume with ID:",
          resumeId
        );
        const response = await getResumeById(resumeId);
        console.log("[ResumeProcessingPage] Resume data received:", response);
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch resume");
        }
        // Defensive: fallback to _id if taskId is missing
        const taskId = response.data.taskId || response.data._id;
        if (!taskId) {
          throw new Error("No task ID found for this resume");
        }
        const processedResume = processResumeData({ ...response.data, taskId });
        setResume(processedResume);
        if (!processedResume.processed && !processedResume.processingError) {
          setProcessingStatus("pending");
          pollTaskStatus(taskId);
        } else if (processedResume.processed) {
          setProcessingStatus("completed");
          setLoading(false);
        } else if (processedResume.processingError) {
          throw new Error(processedResume.processingError);
        }
      } catch (err: any) {
        console.error("[ResumeProcessingPage] Error fetching resume:", err);
        setError(err.message || "Failed to load resume");
        setProcessingStatus("failed");
        setLoading(false);
      }
    };
    fetchResume();
  }, [routeResumeId, pollTaskStatus]);

  return (
    <Layout title="Resume Processing">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error ? (
          <div className="bg-white rounded-lg shadow-lg p-8 border border-red-100">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center">
              <svg
                className="h-6 w-6 text-red-400 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  Error Loading Resume
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-1">
                    Please try again in a few moments. If the problem persists,
                    you may need to reupload your resume.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex space-x-4">
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  window.location.reload();
                }}
                className="inline-flex items-center px-6 py-2 border border-transparent text-base font-semibold rounded-lg shadow text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-6 py-2 border border-gray-300 text-base font-semibold rounded-lg shadow text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : loading && processingStatus === "pending" ? (
          <div className="bg-white rounded-lg shadow-lg p-8 border border-blue-100 flex flex-col items-center justify-center">
            <svg
              className="animate-spin h-14 w-14 text-blue-500 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-lg font-semibold text-gray-900">
              Processing Resume
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Please wait while we analyze your resume. This may take up to a
              minute.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-400 h-2 rounded-full animate-pulse"
                style={{ width: "80%" }}
              ></div>
            </div>
          </div>
        ) : resume ? (
          <div className="space-y-6">
            {resume.candidateName && (
              <div className="bg-white rounded-lg shadow p-6 border border-blue-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {resume.candidateName}
                </h2>
                <p className="text-gray-600">
                  Here are the results of your resume analysis for the selected
                  job.
                </p>
              </div>
            )}
            <ResumeResults resume={resume} />
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default ResumeProcessingPage;
