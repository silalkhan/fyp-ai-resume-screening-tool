import React from "react";
import { Resume } from "../../types";
import {
  calculateTotalExperience,
  categorizeSkills,
} from "../../utils/resumeDataProcessor";

interface ResumeResultsProps {
  resume: Resume;
}

const ResumeResults: React.FC<ResumeResultsProps> = ({ resume }) => {
  const totalExperience = calculateTotalExperience(resume);
  const { matchedSkills, unmatchedSkills } = categorizeSkills(resume);

  // Add debugging to log resume data
  console.log("ResumeResults - Resume data:", resume);
  console.log("ResumeResults - Match score:", resume.matchScore);
  console.log("ResumeResults - Processed:", resume.processed);
  console.log("ResumeResults - Processing:", resume.processing);
  console.log("ResumeResults - ProcessingError:", resume.processingError);

  const renderMatchScore = () => {
    const score = resume.matchScore || 0;
    let colorClass = "bg-red-500";
    if (score >= 80) colorClass = "bg-green-500";
    else if (score >= 60) colorClass = "bg-yellow-500";

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-blue-100">
        <div className="flex items-center mb-4">
          <svg
            className="h-7 w-7 text-blue-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m4 0h-1v-4h-1m4 0h-1v-4h-1"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800">Match Score</h3>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div
            className={`${colorClass} h-4 rounded-full transition-all duration-500`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-gray-900">{score}%</span>
          {score >= 75 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Shortlisted for Interview
            </span>
          )}
        </div>
      </div>
    );
  };

  // Check if resume is still being processed or has an error
  if (resume.processing || (!resume.processed && !resume.processingError)) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="animate-spin h-5 w-5 text-blue-500 mr-4"
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
            </div>
            <div>
              <p className="text-blue-700 font-medium">
                Processing Your Resume
              </p>
              <p className="text-blue-600 text-sm mt-1">
                Please wait while we analyze your resume...
              </p>
              {resume.taskId && (
                <p className="text-blue-600 text-xs mt-1">
                  Task ID: {resume.taskId}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if processing failed
  if (resume.processingError) {
    // Even if there's an error, show the match score if available
    if (resume.matchScore !== undefined && resume.matchScore !== null) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-red-200">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Processing Warning
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{resume.processingError}</p>
                    <p className="mt-1">
                      Some resume data may be incomplete, but we can show your
                      match score.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Show match score even with error */}
          {renderMatchScore()}

          {/* Basic resume info if available */}
          {resume.candidateName && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900">
                {resume.candidateName}
              </h2>
              {resume.contactInfo?.email && (
                <p className="text-gray-600 mt-2">
                  Email: {resume.contactInfo.email}
                </p>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border border-red-200">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Processing Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{resume.processingError}</p>
                <p className="mt-1">Please try uploading your resume again.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 flex items-center">
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
            d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-blue-700">
          Welcome, <span className="font-semibold">{resume.candidateName}</span>
          ! Here's your resume analysis for the selected position.
        </p>
      </div>

      {/* Match Score */}
      {resume.processed && renderMatchScore()}

      {/* Resume Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-gray-100 rounded-full mr-3">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">
              Resume File Information
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium text-gray-600">File Name:</span>
              </div>
              <span className="text-gray-800">
                {(resume.fileName || resume.originalFilename || "").replace(
                  /\s+/g,
                  ""
                )}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium text-gray-600">File Format:</span>
              </div>
              <span className="text-gray-800">
                {resume.mimeType?.includes("pdf") ? "PDF" : "DOCX"}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  />
                </svg>
                <span className="font-medium text-gray-600">File Size:</span>
              </div>
              <span className="text-gray-800">
                {resume.fileSize ? (resume.fileSize / 1024).toFixed(2) : "0"} KB
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium text-gray-600">Upload Date:</span>
              </div>
              <span className="text-gray-800">
                {new Date(resume.uploadDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-50 rounded-full mr-3">
              <svg
                className="h-6 w-6 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">
              Contact Information
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="font-medium text-gray-600">Name:</span>
              </div>
              <span className="text-gray-800">{resume.candidateName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium text-gray-600">Email:</span>
              </div>
              <span className="text-gray-800">
                {resume.contactInfo?.email || "Not provided"}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="font-medium text-gray-600">Phone:</span>
              </div>
              <span className="text-gray-800">
                {resume.contactInfo?.phone || "Not provided"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="font-medium text-gray-600">Location:</span>
              </div>
              <span className="text-gray-800">
                {resume.contactInfo?.location || "Not detected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-100">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-50 rounded-full mr-3">
            <svg
              className="h-6 w-6 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">
            Skills Analysis
          </h3>
        </div>
        <div className="space-y-4">
          {/* Matched Skills Section */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h4 className="flex items-center font-medium text-green-700 mb-3">
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Matched Skills
            </h4>
            {matchedSkills && matchedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {matchedSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No skills matched with the job requirements.
              </p>
            )}
          </div>

          {/* Other Skills Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h4 className="flex items-center font-medium text-gray-700 mb-3">
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Other Skills
            </h4>
            {unmatchedSkills && unmatchedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {unmatchedSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No additional skills detected.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Experience Section */}
      {resume.processedData?.experience &&
        resume.processedData.experience.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-green-100">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-50 rounded-full mr-3">
                <svg
                  className="h-6 w-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Experience
              </h3>
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                {totalExperience} years
              </span>
            </div>
            <ul className="divide-y divide-gray-100">
              {resume.processedData.experience.map((exp, idx) => (
                <li key={idx} className="py-3">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div className="mb-1 md:mb-0">
                      <span className="font-semibold text-gray-800">
                        {exp.position}
                      </span>{" "}
                      <span className="text-gray-600">at {exp.company}</span>
                    </div>
                    {exp.duration && (
                      <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded-full">
                        {exp.duration}
                      </span>
                    )}
                  </div>
                  {exp.description && (
                    <div className="text-gray-600 text-sm mt-1 bg-gray-50 p-2 rounded">
                      {exp.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Education Section */}
      {resume.processedData?.education &&
        resume.processedData.education.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-yellow-100">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-yellow-50 rounded-full mr-3">
                <svg
                  className="h-6 w-6 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l6.16-3.422A12.083 12.083 0 0121 12.5c0 .88-.13 1.733-.37 2.54M12 14l-6.16-3.422A12.086 12.086 0 013 12.5c0 .88.13 1.733.37 2.54M12 14v10"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Education</h3>
            </div>
            <ul className="divide-y divide-gray-100">
              {resume.processedData.education.map((edu, idx) => (
                <li key={idx} className="py-3">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div className="mb-1 md:mb-0">
                      <span className="font-semibold text-gray-800">
                        {edu.degree}
                      </span>{" "}
                      <span className="text-gray-600">
                        at {edu.institution}
                      </span>
                    </div>
                    {edu.year && (
                      <span className="text-gray-500 text-sm bg-yellow-50 px-2 py-1 rounded-full">
                        {edu.year}
                      </span>
                    )}
                  </div>
                  {edu.field && (
                    <div className="text-gray-600 text-sm mt-1">
                      <span className="font-medium">Field:</span> {edu.field}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Projects Section */}
      {resume.processedData?.projects &&
        resume.processedData.projects.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-purple-100">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-50 rounded-full mr-3">
                <svg
                  className="h-6 w-6 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Projects</h3>
            </div>
            <ul className="divide-y divide-gray-100">
              {resume.processedData.projects.map((proj, idx) => (
                <li key={idx} className="py-3">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div className="mb-1 md:mb-0">
                      <span className="font-semibold text-gray-800">
                        {proj.title}
                      </span>
                    </div>
                    {proj.duration && (
                      <span className="text-gray-500 text-sm bg-purple-50 px-2 py-1 rounded-full">
                        {proj.duration}
                      </span>
                    )}
                  </div>
                  {proj.description && (
                    <div className="text-gray-600 text-sm mt-1 bg-gray-50 p-2 rounded">
                      {proj.description}
                    </div>
                  )}
                  {proj.skills && proj.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {proj.skills.map((skill, skillIdx) => (
                        <span
                          key={skillIdx}
                          className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
};

export default ResumeResults;
