import React, { useState } from "react";
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
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      // Validate file type and size
      if (
        ![
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(selected.type)
      ) {
        setFileError("Only PDF and DOCX files are allowed.");
        setFile(null);
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setFileError("File size must be less than 5MB.");
        setFile(null);
        return;
      }
      setFileError(null);
      setFile(selected);
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
        navigate(`/resumes/${response.data._id}/processing`);
      } else {
        toast.error(response.message || "Error uploading resume");
      }
    } catch (error: any) {
      console.error("Error uploading resume:", error);
      toast.error(error.message || "Failed to upload resume");
      toast.error("Failed to upload resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg mx-auto border border-blue-100">
      <div className="flex items-center mb-4">
        <svg
          className="h-6 w-6 text-blue-400 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <h2 className="text-xl font-semibold">Upload Your Resume</h2>
      </div>
      <p className="mb-4 text-gray-600">
        Upload your resume for the{" "}
        <strong>{jobDescription?.title || "Selected"}</strong> position.
        <br />
        <span className="text-sm text-gray-400">
          PDF and DOCX only, max 5MB.
        </span>
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="resume"
          >
            Resume File
          </label>
          <input
            type="file"
            id="resume"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            {file ? `Selected file: ${file.name}` : "No file selected"}
          </p>
          {fileError && (
            <p className="text-xs text-red-500 mt-1">{fileError}</p>
          )}
        </div>
        <div className="mt-6">
          <button
            type="submit"
            className={`w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors duration-200 ${
              loading || !file ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={loading || !file}
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
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
            )}
            {loading ? "Uploading..." : "Upload and Process Resume"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResumeUpload;
