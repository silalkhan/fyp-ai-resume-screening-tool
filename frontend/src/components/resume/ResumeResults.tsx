import React from "react";
import { Resume } from "../../types";
import { calculateTotalExperience } from "../../utils/resumeDataProcessor";

interface ResumeResultsProps {
  resume: Resume;
}

const ResumeResults: React.FC<ResumeResultsProps> = ({ resume }) => {
  const totalExperience = calculateTotalExperience(resume);

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
            <svg
              className="h-6 w-6 text-gray-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7V3a1 1 0 011-1h8a1 1 0 011 1v4"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h10M7 7v10a1 1 0 001 1h6a1 1 0 001-1V7"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800">
              Resume File Information
            </h3>
          </div>
          <div className="space-y-3">
            <p className="flex justify-between text-gray-600">
              <span className="font-medium">File Name:</span>
              <span>{resume.fileName}</span>
            </p>
            <p className="flex justify-between text-gray-600">
              <span className="font-medium">File Format:</span>
              <span>{resume.mimeType?.includes("pdf") ? "PDF" : "DOCX"}</span>
            </p>
            <p className="flex justify-between text-gray-600">
              <span className="font-medium">File Size:</span>
              <span>
                {resume.fileSize ? (resume.fileSize / 1024).toFixed(2) : "0"} KB
              </span>
            </p>
            <p className="flex justify-between text-gray-600">
              <span className="font-medium">Upload Date:</span>
              <span>{new Date(resume.uploadDate).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <svg
              className="h-6 w-6 text-gray-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 01-8 0"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14v7m0 0H9m3 0h3"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800">
              Contact Information
            </h3>
          </div>
          <div className="space-y-3">
            <p className="flex justify-between text-gray-600">
              <span className="font-medium">Name:</span>
              <span>{resume.candidateName}</span>
            </p>
            <p className="flex justify-between text-gray-600">
              <span className="font-medium">Email:</span>
              <span>{resume.contactInfo?.email || "Not provided"}</span>
            </p>
            <p className="flex justify-between text-gray-600">
              <span className="font-medium">Phone:</span>
              <span>{resume.contactInfo?.phone || "Not provided"}</span>
            </p>
            <p className="flex justify-between text-gray-600">
              <span className="font-medium">Location:</span>
              <span>{resume.contactInfo?.location || "Not detected"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Skills Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-100">
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
              d="M9.75 17L6 13.25l1.41-1.41L9.75 14.17l6.84-6.84L18 8.75z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800">
            Skills Analysis
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Detected Skills</h4>
            <div className="flex flex-wrap gap-2">
              {resume.processedData?.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Experience Section */}
      {resume.processedData?.experience &&
        resume.processedData.experience.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-green-100">
            <div className="flex items-center mb-4">
              <svg
                className="h-6 w-6 text-green-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 17v-2a2 2 0 012-2h6a2 2 0 012 2v2"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800">
                Experience
              </h3>
              <span className="ml-2 text-sm text-gray-500">
                Total: {totalExperience} years
              </span>
            </div>
            <ul className="divide-y divide-gray-100">
              {resume.processedData.experience.map((exp, idx) => (
                <li key={idx} className="py-2">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                      <span className="font-semibold text-gray-700">
                        {exp.position}
                      </span>{" "}
                      at <span className="text-gray-600">{exp.company}</span>
                    </div>
                    {exp.duration && (
                      <span className="text-gray-500 text-sm">
                        {exp.duration}
                      </span>
                    )}
                  </div>
                  {exp.description && (
                    <div className="text-gray-500 text-sm mt-1">
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
              <svg
                className="h-6 w-6 text-yellow-400 mr-2"
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
                  d="M12 14l6.16-3.422A12.083 12.083 0 0121 13.5c0 2.485-4.03 4.5-9 4.5s-9-2.015-9-4.5c0-.943.38-1.823 1.06-2.578L12 14z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800">Education</h3>
            </div>
            <ul className="divide-y divide-gray-100">
              {resume.processedData.education.map((edu, idx) => (
                <li key={idx} className="py-2">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                      <span className="font-semibold text-gray-700">
                        {edu.degree}
                      </span>{" "}
                      at{" "}
                      <span className="text-gray-600">{edu.institution}</span>
                    </div>
                    {edu.year && (
                      <span className="text-gray-500 text-sm">{edu.year}</span>
                    )}
                  </div>
                  {edu.field && (
                    <div className="text-gray-500 text-sm mt-1">
                      Field: {edu.field}
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
              <svg
                className="h-6 w-6 text-purple-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 2v2m0 16v2m8-10h2M2 12H4m15.364-7.364l1.414 1.414M4.222 19.778l1.414-1.414M19.778 19.778l-1.414-1.414M4.222 4.222l1.414 1.414"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800">Projects</h3>
            </div>
            <ul className="divide-y divide-gray-100">
              {resume.processedData.projects.map((proj, idx) => (
                <li key={idx} className="py-2">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                      <span className="font-semibold text-gray-700">
                        {proj.title}
                      </span>
                    </div>
                    {proj.duration && (
                      <span className="text-gray-500 text-sm">
                        {proj.duration}
                      </span>
                    )}
                  </div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="text-gray-500 text-sm mt-1">
                      Tech: {proj.technologies.join(", ")}
                    </div>
                  )}
                  {proj.description && (
                    <div className="text-gray-500 text-sm mt-1">
                      {proj.description}
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
