import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ResumeResults from "../components/resume/ResumeResults";
import Loading from "../components/ui/Loading";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import {
  getResumeById,
  checkProcessingStatus,
  getJobDescriptionById,
  fixProcessingIssue,
} from "../services/api";
import { Resume } from "../types";
import { processResumeData } from "../utils/resumeDataProcessor";

const MAX_POLL_ATTEMPTS = 30; // 5 minutes total with 10s intervals
const INITIAL_POLL_INTERVAL = 5000; // Start with 5 second intervals
const MAX_POLL_INTERVAL = 10000; // Max 10 second intervals

const ResumeProcessingPage: React.FC = () => {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<
    "pending" | "completed" | "failed"
  >("pending");
  const [pollCount, setPollCount] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Defensive: log and check resumeId
  useEffect(() => {
    console.log("[ResumeProcessingPage] resumeId:", resumeId);
  }, [resumeId]);

  const pollTaskStatus = useCallback(
    async (taskId: string) => {
      try {
        if (!taskId) {
          throw new Error("Task ID is required for checking processing status");
        }

        if (pollCount >= MAX_POLL_ATTEMPTS) {
          throw new Error(
            "Resume processing is taking longer than expected. Please try again later."
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

          if (!resumeId) {
            throw new Error("Resume ID is missing");
          }

          try {
            const updatedResumeResponse = await getResumeById(resumeId);
            console.log("Updated resume response:", updatedResumeResponse);

            if (!updatedResumeResponse.success || !updatedResumeResponse.data) {
              throw new Error(
                updatedResumeResponse.message ||
                  "Failed to retrieve processed resume data. Please try again."
              );
            }

            // Ensure job description is loaded if jobDescriptionId exists
            let resumeData = updatedResumeResponse.data;
            if (resumeData.jobDescriptionId && !resumeData.jobDescription) {
              try {
                const jobDescResponse = await getJobDescriptionById(
                  resumeData.jobDescriptionId
                );
                if (jobDescResponse.success && jobDescResponse.data) {
                  resumeData.jobDescription = jobDescResponse.data;
                }
              } catch (err) {
                console.error("Failed to fetch job description:", err);
                // Continue without job description
              }
            }

            if (!resumeData.processedData) {
              setDebugInfo(JSON.stringify(resumeData, null, 2));
              throw new Error(
                "Resume processing completed but results were not found. Please try uploading again."
              );
            }

            // Ensure all required fields are present
            const updatedResumeData = {
              ...resumeData,
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
          } catch (fetchError: any) {
            console.error("Error fetching updated resume:", fetchError);
            throw new Error(
              `Error fetching processed resume: ${fetchError.message}`
            );
          }
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

        // Handle specific error cases
        if (err.response && err.response.status === 500) {
          setError(
            "The server encountered an internal error. This may be because the NLP service is offline."
          );
          setDebugInfo(
            `Server error (500) while processing resume. Task ID: ${taskId}`
          );
        } else {
          setError(
            err.message || "Failed to process resume. Please try again."
          );
        }

        setProcessingStatus("failed");
        setLoading(false);
      }
    },
    [resumeId, pollCount]
  );

  const fetchResume = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);

    if (!resumeId) {
      setError("No resume ID provided in URL. Please return and try again.");
      setLoading(false);
      return;
    }

    try {
      console.log("[ResumeProcessingPage] Fetching resume with ID:", resumeId);
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

      // Create a complete resume object with required fields
      const initialResumeData = {
        ...response.data,
        taskId,
        processed: !!response.data.processedData || !!response.data.matchScore,
        processing: !response.data.processedData && !response.data.matchScore,
        processingError: null,
      };

      // If resume has a matchScore but no processedData, create minimal processedData
      if (response.data.matchScore && !response.data.processedData) {
        console.log(
          "Resume has matchScore but no processedData, creating minimal structure"
        );
        initialResumeData.processedData = {
          skills: [],
          education: [],
          experience: [],
          projects: [],
        };
        initialResumeData.processed = true;
        initialResumeData.processing = false;
      }

      const processedResume = processResumeData(initialResumeData);
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

      // Check if it's an Axios error with a response
      if (err.response) {
        const statusCode = err.response.status;
        const errorMessage = err.response.data?.message || err.message;

        if (statusCode === 500) {
          setError(
            "The server encountered an internal error. This may be because the NLP service is offline."
          );
          setDebugInfo(
            `Server error (500) while fetching resume. ID: ${resumeId}`
          );
        } else {
          setError(`Error (${statusCode}): ${errorMessage}`);
          setDebugInfo(
            `Status: ${statusCode}, URL: ${
              err.response.config?.url || "unknown"
            }`
          );
        }
      } else {
        setError(err.message || "Failed to load resume");
      }

      setProcessingStatus("failed");
      setLoading(false);
    }
  }, [resumeId, pollTaskStatus]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setProcessingStatus("pending");
    setPollCount(0);
    // Call the fetchResume function defined in the useEffect
    // We need to define it outside to reuse it here
    setError(null);
    fetchResume();
  };

  // Add force reprocess handler
  const handleForceReprocess = async () => {
    if (!resumeId) return;

    setLoading(true);
    setError("Attempting to force reprocessing...");

    try {
      const response = await fixProcessingIssue(resumeId, true);
      console.log("Force reprocess response:", response);

      if (response.success) {
        setError(null);
        setProcessingStatus("pending");
        setPollCount(0);
        // Wait a moment before fetching to allow processing to start
        setTimeout(fetchResume, 2000);
      } else {
        setError(`Failed to reprocess: ${response.message}`);
        setLoading(false);
      }
    } catch (err: any) {
      setError(`Error reprocessing resume: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {error ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Alert variant="error" title="Error Loading Resume" message={error} />
          {debugInfo && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md overflow-auto">
              <p className="text-xs text-gray-600 font-mono">{debugInfo}</p>
            </div>
          )}
          <div className="mt-6 flex space-x-4">
            <Button variant="primary" onClick={handleRetry}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button
              onClick={handleForceReprocess}
              variant="danger"
              className="ml-auto"
            >
              Force Reprocess
            </Button>
          </div>
        </div>
      ) : loading && processingStatus === "pending" ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loading
              size="large"
              text="Please wait while we analyze your resume..."
            />
            {resume?.taskId && (
              <p className="text-sm text-gray-500 mt-4">
                Task ID: <span className="font-mono">{resume.taskId}</span>
              </p>
            )}
            <p className="text-sm text-gray-500">
              Processing attempt: {pollCount + 1}/{MAX_POLL_ATTEMPTS}
            </p>
          </div>
        </div>
      ) : resume ? (
        <div className="space-y-6">
          {resume.candidateName && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
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
  );
};

export default ResumeProcessingPage;
