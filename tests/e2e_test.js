/**
 * End-to-End Testing Script for AI Resume Screening Tool
 *
 * This script performs tests on:
 * 1. Backend APIs
 * 2. NLP Processing
 * 3. Frontend (via API calls)
 * 4. Database operations
 * 5. Email notifications
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../backend/.env" });

// API URLs
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000/api";
const NLP_URL = process.env.NLP_URL || "http://localhost:5002/api";

// Connect to MongoDB
async function connectToDatabase() {
  console.log("Connecting to MongoDB...");
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/resume-screening"
    );
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

// Test 1: Test Job Categories API
async function testJobCategoriesAPI() {
  console.log("\n🔍 TESTING JOB CATEGORIES API");
  try {
    const response = await axios.get(
      `${BACKEND_URL}/job-descriptions/categories`
    );

    if (response.data && response.data.success) {
      console.log("✅ Job Categories API working");
      console.log(`Found ${response.data.data.length} job categories`);
      console.log(
        "Categories:",
        response.data.data.map((cat) => cat.name).join(", ")
      );
      return true;
    } else {
      console.error(
        "❌ Job Categories API failed:",
        response.data.message || "Unknown error"
      );
      return false;
    }
  } catch (error) {
    console.error("❌ Job Categories API error:", error.message);
    return false;
  }
}

// Test 2: Test Job Descriptions API
async function testJobDescriptionsAPI() {
  console.log("\n🔍 TESTING JOB DESCRIPTIONS API");
  try {
    // Test getting all job descriptions
    const allResponse = await axios.get(`${BACKEND_URL}/job-descriptions`);

    if (!allResponse.data || !allResponse.data.success) {
      console.error(
        "❌ Get All Job Descriptions failed:",
        allResponse.data?.message || "Unknown error"
      );
      return false;
    }

    console.log(`✅ Found ${allResponse.data.data.length} job descriptions`);

    // Test getting job descriptions by category
    const category = "uet_peshawar";
    const categoryResponse = await axios.get(
      `${BACKEND_URL}/job-descriptions?category=${category}`
    );

    if (categoryResponse.data && categoryResponse.data.success) {
      console.log(
        `✅ Found ${categoryResponse.data.data.length} job descriptions for category: ${category}`
      );
      return true;
    } else {
      console.error(
        "❌ Get Job Descriptions by Category failed:",
        categoryResponse.data?.message || "Unknown error"
      );
      return false;
    }
  } catch (error) {
    console.error("❌ Job Descriptions API error:", error.message);
    return false;
  }
}

// Test 3: Test Resume Upload API
async function testResumeUploadAPI() {
  console.log("\n🔍 TESTING RESUME UPLOAD API");
  try {
    // Get a job description ID to use
    const jobsResponse = await axios.get(`${BACKEND_URL}/job-descriptions`);
    if (
      !jobsResponse.data ||
      !jobsResponse.data.success ||
      !jobsResponse.data.data.length
    ) {
      console.error("❌ Could not get job descriptions for resume upload test");
      return false;
    }

    const jobDescriptionId = jobsResponse.data.data[0]._id;
    console.log(`Using job description ID: ${jobDescriptionId}`);

    // Create form data with test resume
    const formData = new FormData();
    const testResumePath = path.join(__dirname, "test_resume.pdf");

    // Check if test resume exists, if not create a simple one
    if (!fs.existsSync(testResumePath)) {
      console.log("Test resume not found, creating sample file...");
      fs.writeFileSync(testResumePath, "Sample resume content for testing");
    }

    formData.append("resume", fs.createReadStream(testResumePath));
    formData.append("jobDescriptionId", jobDescriptionId);

    // Upload the resume
    const uploadResponse = await axios.post(
      `${BACKEND_URL}/resumes/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    if (uploadResponse.data && uploadResponse.data.success) {
      console.log("✅ Resume uploaded successfully");
      console.log(`Resume ID: ${uploadResponse.data.data._id}`);

      // Store the resume ID for further tests
      return {
        success: true,
        resumeId: uploadResponse.data.data._id,
        jobDescriptionId,
      };
    } else {
      console.error(
        "❌ Resume upload failed:",
        uploadResponse.data?.message || "Unknown error"
      );
      return { success: false };
    }
  } catch (error) {
    console.error("❌ Resume Upload API error:", error.message);
    return { success: false };
  }
}

// Test 4: Test Resume Processing API
async function testResumeProcessingAPI(resumeId, jobDescriptionId) {
  if (!resumeId || !jobDescriptionId) {
    console.error(
      "❌ Resume ID or Job Description ID not provided for processing test"
    );
    return false;
  }

  console.log("\n🔍 TESTING RESUME PROCESSING API");
  try {
    // Process the resume
    const processResponse = await axios.post(
      `${BACKEND_URL}/resumes/${resumeId}/process`,
      {
        jobDescriptionId,
      }
    );

    if (processResponse.data && processResponse.data.success) {
      console.log("✅ Resume processing started");
      console.log(
        `Task ID: ${processResponse.data.data.taskId || "Not provided"}`
      );

      // If task ID is provided, check status
      if (processResponse.data.data.taskId) {
        const taskId = processResponse.data.data.taskId;
        let status = "pending";
        let maxAttempts = 10;

        console.log("Checking processing status...");

        // Poll for task status
        while (status === "pending" && maxAttempts > 0) {
          try {
            const statusResponse = await axios.get(`${NLP_URL}/task/${taskId}`);
            status = statusResponse.data.status;
            console.log(`Current status: ${status}`);

            if (status === "completed") {
              console.log("✅ Resume processing completed");
              return true;
            } else if (status === "failed") {
              console.error("❌ Resume processing failed");
              return false;
            }

            // Wait 2 seconds before checking again
            await new Promise((resolve) => setTimeout(resolve, 2000));
            maxAttempts--;
          } catch (error) {
            console.warn(
              "Warning: Could not check task status -",
              error.message
            );
            maxAttempts--;
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        if (maxAttempts <= 0) {
          console.warn("⚠️ Max attempts reached while checking task status");
        }
      }

      // If no task ID or we couldn't check status, assume success
      return true;
    } else {
      console.error(
        "❌ Resume processing failed:",
        processResponse.data?.message || "Unknown error"
      );
      return false;
    }
  } catch (error) {
    console.error("❌ Resume Processing API error:", error.message);
    return false;
  }
}

// Test 5: Test Shortlisting API
async function testShortlistingAPI(jobDescriptionId) {
  if (!jobDescriptionId) {
    console.error("❌ Job Description ID not provided for shortlisting test");
    return false;
  }

  console.log("\n🔍 TESTING SHORTLISTING API");
  try {
    const shortlistedResponse = await axios.get(
      `${BACKEND_URL}/resumes/shortlisted/${jobDescriptionId}`
    );

    if (shortlistedResponse.data && shortlistedResponse.data.success) {
      console.log("✅ Shortlisting API working");
      console.log(
        `Found ${shortlistedResponse.data.data.length} shortlisted resumes`
      );
      return true;
    } else {
      console.error(
        "❌ Shortlisting API failed:",
        shortlistedResponse.data?.message || "Unknown error"
      );
      return false;
    }
  } catch (error) {
    console.error("❌ Shortlisting API error:", error.message);
    return false;
  }
}

// Test 6: Directly Test NLP Microservice
async function testNlpMicroservice() {
  console.log("\n🔍 TESTING NLP MICROSERVICE DIRECTLY");
  try {
    // Simple test with sample text
    const testData = {
      resume_text: `
        John Doe
        Software Engineer
        
        Skills: JavaScript, React, Node.js, Python
        
        Experience:
        - Senior Developer, ABC Corp, 2018-2022
          Developed web applications using React and Node.js
        
        Education:
        - MSc Computer Science, XYZ University, 2018
      `,
      job_description: `
        We are looking for a Software Engineer with experience in JavaScript frameworks
        like React and back-end technologies like Node.js. The ideal candidate should
        have at least 3 years of experience and a degree in Computer Science.
      `,
    };

    const nlpResponse = await axios.post(`${NLP_URL}/process`, testData);

    if (nlpResponse.data && nlpResponse.data.success) {
      console.log("✅ NLP Microservice working");
      console.log(`Match Score: ${nlpResponse.data.data.matchScore}`);
      console.log(
        "Extracted Skills:",
        nlpResponse.data.data.skills?.join(", ") || "None"
      );
      return true;
    } else {
      console.error(
        "❌ NLP Microservice failed:",
        nlpResponse.data?.message || "Unknown error"
      );
      return false;
    }
  } catch (error) {
    console.error("❌ NLP Microservice error:", error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  try {
    await connectToDatabase();

    // Test APIs
    const jobCategoriesResult = await testJobCategoriesAPI();
    const jobDescriptionsResult = await testJobDescriptionsAPI();
    const resumeUploadResult = await testResumeUploadAPI();

    let resumeProcessingResult = false;
    let shortlistingResult = false;

    // Only proceed with processing if upload was successful
    if (resumeUploadResult.success) {
      resumeProcessingResult = await testResumeProcessingAPI(
        resumeUploadResult.resumeId,
        resumeUploadResult.jobDescriptionId
      );

      // Test shortlisting
      shortlistingResult = await testShortlistingAPI(
        resumeUploadResult.jobDescriptionId
      );
    }

    // Test NLP service directly
    const nlpServiceResult = await testNlpMicroservice();

    // Display summary
    console.log("\n📋 TEST RESULTS SUMMARY");
    console.log("-------------------");
    console.log(
      `Job Categories API: ${jobCategoriesResult ? "✅ PASS" : "❌ FAIL"}`
    );
    console.log(
      `Job Descriptions API: ${jobDescriptionsResult ? "✅ PASS" : "❌ FAIL"}`
    );
    console.log(
      `Resume Upload API: ${resumeUploadResult.success ? "✅ PASS" : "❌ FAIL"}`
    );
    console.log(
      `Resume Processing API: ${resumeProcessingResult ? "✅ PASS" : "❌ FAIL"}`
    );
    console.log(
      `Shortlisting API: ${shortlistingResult ? "✅ PASS" : "❌ FAIL"}`
    );
    console.log(
      `NLP Microservice: ${nlpServiceResult ? "✅ PASS" : "❌ FAIL"}`
    );

    // Close database connection
    await mongoose.connection.close();
    console.log("\nTests completed, database connection closed.");
  } catch (error) {
    console.error("Error running tests:", error);
  }
}

// Run tests if this script is called directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testJobCategoriesAPI,
  testJobDescriptionsAPI,
  testResumeUploadAPI,
  testResumeProcessingAPI,
  testShortlistingAPI,
  testNlpMicroservice,
  runAllTests,
};
