import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadResume } from "../../services/api";
import { JobDescription } from "../../types";
import { toast } from "react-toastify";

interface ResumeUploadProps {
  jobDescription: JobDescription;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ jobDescription }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Validate file type
    if (
      ![
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(selectedFile.type)
    ) {
      setFileError("Only PDF and DOCX files are allowed.");
      setFile(null);
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFileError("File size must be less than 5MB.");
      setFile(null);
      return;
    }

    // Remove spaces from file name
    let fileName = selectedFile.name.replace(/\s+/g, "");

    // Create a new file with the modified name
    const modifiedFile = new File([selectedFile], fileName, {
      type: selectedFile.type,
      lastModified: selectedFile.lastModified,
    });

    setFileError(null);
    setFile(modifiedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a resume file to upload");
      return;
    }
    if (!jobDescription || !jobDescription._id) {
      toast.error("Invalid job description. Please select a valid job.");
      return;
    }
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescriptionId", jobDescription._id);
    try {
      setLoading(true);
      const response = await uploadResume(formData);
      if (response.success && response.data) {
        toast.success(
          response.message ||
            "Resume uploaded successfully! Processing started..."
        );

        // Ensure we have a valid ID before navigating
        if (response.data._id) {
          console.log(
            "Navigating to processing page with resume ID:",
            response.data._id
          );
          navigate(`/resumes/${response.data._id}/processing`);
        } else if (response.data.id) {
          console.log(
            "Navigating to processing page with resume ID from .id:",
            response.data.id
          );
          navigate(`/resumes/${response.data.id}/processing`);
        } else {
          console.error("No valid resume ID found in response", response.data);
          toast.error("Error accessing resume. Please try from the dashboard.");
        }
      } else {
        toast.error(response.message || "Error uploading resume");
      }
    } catch (error: any) {
      console.error("Error uploading resume:", error);
      toast.error(error.message || "Failed to upload resume");
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-lg p-8 max-w-lg mx-auto border border-blue-100 dark:border-blue-900 transition-all duration-300">
      <div className="flex items-center mb-6">
        <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/40 mr-4">
          <svg
            className="h-7 w-7 text-blue-500 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Upload Your Resume
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            For the{" "}
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {jobDescription?.title || "Selected"}
            </span>{" "}
            position
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 ${
            isDragging
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500"
              : "border-gray-300 dark:border-gray-600"
          } ${fileError ? "border-red-300 dark:border-red-500" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <input
            type="file"
            id="resume"
            ref={fileInputRef}
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="hidden"
            required={!file}
            disabled={loading}
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            {!file ? (
              <>
                <svg
                  className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
                <div className="text-gray-700 dark:text-gray-300 font-medium">
                  Drag & drop your resume here or click to browse
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  PDF and DOCX only, max 5MB
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <svg
                  className="h-12 w-12 text-green-500 dark:text-green-400 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-gray-700 dark:text-gray-300 font-medium">
                  File selected!
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 mt-2 rounded-full">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
                <button
                  type="button"
                  className="mt-4 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  Remove file
                </button>
              </div>
            )}
          </div>

          {fileError && (
            <div className="mt-4 text-red-500 text-sm bg-red-50 dark:bg-red-900/30 dark:text-red-400 p-2 rounded-md">
              <svg
                className="h-5 w-5 text-red-500 dark:text-red-400 inline-block mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {fileError}
            </div>
          )}
        </div>

        <div className="mt-8">
          <button
            type="submit"
            className={`w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 transition-colors ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Processing...
              </div>
            ) : (
              <div className="flex items-center">
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload and Process Resume
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResumeUpload;
