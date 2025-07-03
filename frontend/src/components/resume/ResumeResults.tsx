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
  // Add debugging to log resume data
  console.log("ResumeResults - Resume data:", resume);
  console.log("ResumeResults - Match score:", resume.matchScore);

  // Ensure resume has processedData to avoid errors
  if (!resume.processedData) {
    resume.processedData = {
      skills: [],
      education: [],
      experience: [],
      projects: [],
    };
  }

  // REMOVED ALL DEFAULT MOCK DATA CODE
  // No more adding default skills, education, experience or projects
  // We will only display what comes from the NLP server

  const { matchedSkills, unmatchedSkills } = categorizeSkills(resume);
  const totalExperience = calculateTotalExperience(resume);

  // Format total experience years to show "1 year" vs "2 years"
  const formattedExperience =
    totalExperience === 1 ? "1 year" : `${totalExperience} years`;

  return (
    <div className="space-y-10 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
      {/* Welcome Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-primary-500 p-4 rounded-md shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-primary-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-primary-700 dark:text-primary-300">
              {resume.candidateName ? (
                <>
                  Welcome,{" "}
                  <span className="font-bold">{resume.candidateName}</span>!
                  Here's your resume analysis for the selected position.
                </>
              ) : (
                <>
                  Here are the results of your resume analysis for the selected
                  job.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Match Score */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="p-3 rounded-full bg-primary-50 dark:bg-primary-900/30 mr-4">
            <svg
              className="h-7 w-7 text-primary-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Match Score
          </h2>
        </div>

        <div className="relative pt-1 mb-4">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-3xl font-bold text-primary-500 dark:text-primary-400">
                {resume.matchScore !== undefined && resume.matchScore !== null
                  ? Math.round(resume.matchScore)
                  : 0}
                %
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-3 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
            <div
              style={{
                width: `${Math.round(resume.matchScore ?? 0)}%`,
              }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                (resume.matchScore ?? 0) >= 75
                  ? "bg-green-500"
                  : (resume.matchScore ?? 0) >= 50
                  ? "bg-yellow-500"
                  : (resume.matchScore ?? 0) >= 30
                  ? "bg-orange-500"
                  : "bg-red-500"
              }`}
            ></div>
          </div>
        </div>

        <div className="text-gray-700 dark:text-gray-300 text-sm">
          <p>
            Based on the analysis of your resume against the job requirements,
            {(resume.matchScore ?? 0) >= 75 ? (
              <span className="text-green-600 dark:text-green-400 font-medium">
                {" "}
                you have an excellent match for this position.
              </span>
            ) : (resume.matchScore ?? 0) >= 50 ? (
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                {" "}
                you have a good match for this position.
              </span>
            ) : (resume.matchScore ?? 0) >= 30 ? (
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                {" "}
                you have a moderate match for this position.
              </span>
            ) : (
              <span className="text-red-600 dark:text-red-400 font-medium">
                {" "}
                your skills don't align well with this position's requirements.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Resume Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full mr-3">
              <svg
                className="h-6 w-6 text-gray-600 dark:text-gray-300"
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
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Resume File Information
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2"
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
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  File Name:
                </span>
              </div>
              <span className="text-gray-800 dark:text-gray-200">
                {(
                  resume.fileName ||
                  resume.originalFilename ||
                  "Resume"
                ).replace(/\s+/g, "")}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2"
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
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  File Format:
                </span>
              </div>
              <span className="text-gray-800 dark:text-gray-200">
                {resume.mimeType?.includes("pdf") ? "PDF" : "DOCX"}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  File Size:
                </span>
              </div>
              <span className="text-gray-800 dark:text-gray-200">
                {resume.fileSize
                  ? `${(resume.fileSize / 1024).toFixed(2)} KB`
                  : "Unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2"
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
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Upload Date:
                </span>
              </div>
              <span className="text-gray-800 dark:text-gray-200">
                {resume.uploadDate
                  ? new Date(resume.uploadDate).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full mr-3">
              <svg
                className="h-6 w-6 text-gray-600 dark:text-gray-300"
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
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Contact Information
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2"
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
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Name:
                </span>
              </div>
              <span className="text-gray-800 dark:text-gray-200">
                {resume.candidateName || "Not detected"}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2"
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
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Email:
                </span>
              </div>
              <span className="text-gray-800 dark:text-gray-200">
                {resume.contactInfo?.email || "Not detected"}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2"
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
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Phone:
                </span>
              </div>
              <span className="text-gray-800 dark:text-gray-200">
                {resume.contactInfo?.phone || "Not detected"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2"
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
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Location:
                </span>
              </div>
              <span className="text-gray-800 dark:text-gray-200">
                {resume.contactInfo?.location || "Not detected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="p-3 rounded-full bg-primary-50 dark:bg-primary-900/30 mr-4">
            <svg
              className="h-7 w-7 text-primary-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Skills Analysis
          </h2>
        </div>

        {/* Matched Skills */}
        <div className="mb-6">
          <h3 className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            <svg
              className="h-5 w-5 text-green-500 mr-2"
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
          </h3>

          {matchedSkills && matchedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No matching skills found
            </p>
          )}
        </div>

        {/* Other Skills */}
        <div>
          <h3 className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            <svg
              className="h-5 w-5 text-gray-500 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Other Skills
          </h3>

          {unmatchedSkills && unmatchedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {unmatchedSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No additional skills detected
            </p>
          )}
        </div>
      </div>

      {/* Education */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="p-3 rounded-full bg-primary-50 dark:bg-primary-900/30 mr-4">
            <svg
              className="h-7 w-7 text-primary-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Education
          </h2>
        </div>

        {resume.processedData?.education &&
        resume.processedData.education.length > 0 ? (
          <div className="space-y-6">
            {resume.processedData.education.map((edu, index) => (
              <div
                key={index}
                className="border-l-4 border-primary-400 pl-4 py-1"
              >
                <div className="flex flex-col md:flex-row md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {edu.degree || "Degree"}{" "}
                      {edu.field ? `in ${edu.field}` : ""}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      {edu.institution}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 md:text-right">
                    {edu.year || ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <p className="mt-3 text-gray-500 dark:text-gray-400">
              No education history detected
            </p>
          </div>
        )}
      </div>

      {/* Experience */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="p-3 rounded-full bg-primary-50 dark:bg-primary-900/30 mr-4">
            <svg
              className="h-7 w-7 text-primary-500"
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Professional Experience
            {totalExperience > 0 && (
              <span className="ml-2 text-sm font-medium bg-primary-100 text-primary-800 rounded-full px-3 py-1">
                {formattedExperience} total experience
              </span>
            )}
          </h2>
        </div>

        <div className="space-y-8">
          {resume.processedData.experience &&
          resume.processedData.experience.length > 0 ? (
            resume.processedData.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {exp.position}
                  </h3>
                  <span className="bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {exp.duration}
                  </span>
                </div>
                <p className="text-primary-600 dark:text-gray-300 font-medium mb-2">
                  {exp.company}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {exp.description}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No experience history detected
            </p>
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="p-3 rounded-full bg-primary-50 dark:bg-primary-900/30 mr-4">
            <svg
              className="h-7 w-7 text-primary-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Projects
          </h2>
        </div>

        <div className="space-y-8">
          {resume.processedData.projects &&
          resume.processedData.projects.length > 0 ? (
            resume.processedData.projects.map((project, index) => (
              <div key={index}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {project.title}
                  </h3>
                  {project.duration && (
                    <span className="bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {project.duration}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  {project.description}
                </p>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No projects detected
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeResults;
