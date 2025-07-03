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
          throw new Error("No task ID provided for polling");
        }

        console.log(
          `Polling task status for taskId ${taskId} (attempt ${
            pollCount + 1
          }/${MAX_POLL_ATTEMPTS})...`
        );

        const response = await checkProcessingStatus(taskId);
        console.log("Processing status response:", response);

        if (!response || typeof response.status !== "string") {
          console.error("Invalid response format:", response);
          setDebugInfo(JSON.stringify(response, null, 2));
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
              // If we can't get the updated resume data, try to use the result from the task status
              if (response.result?.data) {
                console.log("Using data from task status response instead");

                // Create a minimal resume object with the task result data
                const minimalResume: Resume = {
                  _id: resumeId,
                  taskId: taskId,
                  processed: true,
                  processing: false,
                  processingError: null,
                  matchScore: response.result.data.matchScore ?? 0,
                  processedData: {
                    skills: response.result.data.skills || [],
                    education: response.result.data.education || [],
                    experience: response.result.data.experience || [],
                    projects: response.result.data.projects || [],
                  },
                  // Add required Resume properties
                  fileName: "resume.pdf",
                  filePath: "",
                  uploadDate: new Date().toISOString(),
                  candidateName:
                    response.result.data.candidateName || "Candidate",
                  contactInfo: response.result.data.contactInfo || "",
                  jobDescriptionId: "",
                  shortlisted: false,
                };

                const processedResume = processResumeData(minimalResume);
                setResume(processedResume);
                setProcessingStatus("completed");
                setLoading(false);
                return;
              }

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

            // Check if we really have processed data from NLP
            const hasRealData =
              resumeData.processedData &&
              ((resumeData.processedData.skills &&
                resumeData.processedData.skills.length > 0) ||
                (resumeData.processedData.education &&
                  resumeData.processedData.education.length > 0) ||
                (resumeData.processedData.experience &&
                  resumeData.processedData.experience.length > 0) ||
                (resumeData.processedData.projects &&
                  resumeData.processedData.projects.length > 0));

            if (!hasRealData) {
              console.warn(
                "Resume has no real processed data, checking task result"
              );

              // Try to use the result from the task status if available
              if (response.result?.data) {
                console.log("Using data from task status response");
                resumeData.processedData = {
                  skills: response.result.data.skills || [],
                  education: response.result.data.education || [],
                  experience: response.result.data.experience || [],
                  projects: response.result.data.projects || [],
                };
                resumeData.matchScore = response.result.data.matchScore ?? 0;
              } else {
                setDebugInfo(JSON.stringify(resumeData, null, 2));
                throw new Error(
                  "Resume processing completed but no extraction results were found. The NLP service may have failed to extract data from your resume."
                );
              }
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

        // Check if we've reached the maximum number of polling attempts
        if (pollCount >= MAX_POLL_ATTEMPTS - 1) {
          throw new Error(
            `Maximum polling attempts (${MAX_POLL_ATTEMPTS}) reached. The resume processing is taking longer than expected.`
          );
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
      console.error("ResumeProcessingPage: No resume ID provided in URL");
      setError("No resume ID provided in URL. Please return and try again.");
      setLoading(false);

      // Log current URL for debugging
      console.log("Current URL:", window.location.href);
      console.log("URL pathname:", window.location.pathname);

      // If we're at /resumes/undefined/processing, redirect to home
      if (window.location.href.includes("/resumes/undefined/processing")) {
        console.log("Detected 'undefined' in URL, redirecting to home");
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
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

      // Check if resume has actual processed data
      const hasRealProcessedData =
        response.data.processedData &&
        (response.data.processedData.skills?.length > 0 ||
          response.data.processedData.education?.length > 0 ||
          response.data.processedData.experience?.length > 0 ||
          response.data.processedData.projects?.length > 0);

      // Create a complete resume object with required fields
      const initialResumeData = {
        ...response.data,
        _id: response.data._id || resumeId, // Ensure _id matches the URL param
        taskId,
        processed: hasRealProcessedData,
        processing: !hasRealProcessedData,
        processingError: null,
      };

      // Create minimal processedData if it's missing
      if (!initialResumeData.processedData) {
        console.log(
          "No processedData structure found, creating minimal structure"
        );
        initialResumeData.processedData = {
          skills: [],
          education: [],
          experience: [],
          projects: [],
        };
      }

      const processedResume = processResumeData(initialResumeData);
      setResume(processedResume);

      // If we have valid processed data, show results
      if (hasRealProcessedData) {
        setProcessingStatus("completed");
        setLoading(false);
      }
      // Otherwise poll for task status
      else if (!processedResume.processingError) {
        setProcessingStatus("pending");
        pollTaskStatus(taskId);
      }
      // If there was an error, show it
      else {
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
            `Server error (${statusCode}) during fetch: ${errorMessage}`
          );
        } else {
          setError(`Error ${statusCode}: ${errorMessage}`);
        }
      } else {
        setError(err.message || "Failed to fetch resume");
      }

      setProcessingStatus("failed");
      setLoading(false);
    }
  }, [resumeId, navigate, pollTaskStatus]);

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

    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);

      console.log(
        "[ResumeProcessingPage] Force reprocessing resume:",
        resumeId
      );
      const response = await fixProcessingIssue(resumeId, true);
      console.log("[ResumeProcessingPage] Reprocess response:", response);

      if (!response.success) {
        throw new Error(response.message || "Failed to reprocess resume");
      }

      // After forcing reprocessing, wait briefly then fetch the resume again
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create a safe default data structure if not present
      const updatedResume = response.resume || {};
      if (!updatedResume.processedData) {
        updatedResume.processedData = {
          skills: [],
          education: [],
          experience: [],
          projects: [],
        };
      }

      // If we have a taskId, start polling
      if (updatedResume.taskId) {
        setResume(processResumeData(updatedResume));
        setPollCount(0);
        setProcessingStatus("pending");
        pollTaskStatus(updatedResume.taskId);
      } else {
        // If no task ID, just refresh the page after a delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err: any) {
      console.error(
        "[ResumeProcessingPage] Error during force reprocess:",
        err
      );
      setError(`Error reprocessing resume: ${err.message}`);
      setProcessingStatus("failed");
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
