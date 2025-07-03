import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const NLP_API_URL =
  process.env.REACT_APP_NLP_API_URL || "http://localhost:5002/api";

// Create axios instance for the backend
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create axios instance for the NLP service
const nlpApi = axios.create({
  baseURL: NLP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response || error.message);
    return Promise.reject(error);
  }
);

// Log all requests in development
api.interceptors.request.use((request) => {
  console.log("API Request:", request.method, request.url);
  return request;
});

/**
 * Check the health of the backend service
 * @returns Promise with health status
 */
export const checkBackendHealth = async (): Promise<{
  isHealthy: boolean;
  message: string;
}> => {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return { isHealthy: true, message: "Backend service is running" };
    } else {
      return {
        isHealthy: false,
        message: "Backend service is not responding correctly",
      };
    }
  } catch (error) {
    console.error("Error checking backend health:", error);
    return { isHealthy: false, message: "Cannot connect to backend service" };
  }
};

/**
 * Check the health of the NLP service
 * @returns Promise with health status
 */
export const checkNlpHealth = async (): Promise<{
  isHealthy: boolean;
  message: string;
}> => {
  try {
    const response = await fetch(`${NLP_API_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return { isHealthy: true, message: "NLP service is running" };
    } else {
      return {
        isHealthy: false,
        message: "NLP service is not responding correctly",
      };
    }
  } catch (error) {
    console.error("Error checking NLP health:", error);
    return { isHealthy: false, message: "Cannot connect to NLP service" };
  }
};

// Job Descriptions
export const getJobCategories = async () => {
  try {
    console.log("Fetching job categories from:", `${API_URL}/job-categories`);
    const response = await api.get("/job-categories");
    console.log("Job categories response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching job categories:", error);
    throw error;
  }
};

export const getJobDescriptions = async (category?: string) => {
  try {
    console.log(
      "Fetching job descriptions from:",
      `${API_URL}/job-descriptions`
    );
    console.log("Category filter:", category || "none");

    const params = category ? { category } : {};
    const response = await api.get("/job-descriptions", { params });
    console.log("Job descriptions response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching job descriptions:", error);
    throw error;
  }
};

export const getJobDescriptionById = async (id: string) => {
  try {
    console.log("Fetching job description by ID:", id);
    const response = await api.get(`/job-descriptions/${id}`);
    console.log("Job description response:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching job description ${id}:`, error);
    throw error;
  }
};

export const createJobDescription = async (jobDescriptionData: any) => {
  try {
    console.log("Creating job description with data:", jobDescriptionData);
    const response = await api.post("/job-descriptions", jobDescriptionData);
    console.log("Create job description response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating job description:", error);
    throw error;
  }
};

export const updateJobDescription = async (
  id: string,
  jobDescriptionData: any
) => {
  try {
    console.log(
      `Updating job description ${id} with data:`,
      jobDescriptionData
    );
    const response = await api.put(
      `/job-descriptions/${id}`,
      jobDescriptionData
    );
    console.log("Update job description response:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating job description ${id}:`, error);
    throw error;
  }
};

export const deleteJobDescription = async (id: string) => {
  try {
    console.log(`Deleting job description ${id}`);
    const response = await api.delete(`/job-descriptions/${id}`);
    console.log("Delete job description response:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error deleting job description ${id}:`, error);
    throw error;
  }
};

// Resume Processing
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export const uploadResume = async (
  formData: FormData
): Promise<ApiResponse<any>> => {
  try {
    console.log(
      "Uploading resume with form data:",
      Object.fromEntries(formData.entries())
    );
    const response = await api.post("/resumes/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("Upload response:", response.data);

    if (!response.data) {
      return {
        success: false,
        message: "No response from server",
      };
    }

    // Improve logging and data validation
    console.log("Resume upload response structure:", {
      hasData: !!response.data.data,
      dataType: response.data.data ? typeof response.data.data : "undefined",
      id: response.data.data?._id || response.data.data?.id || "Not found",
      hasTaskId: !!response.data.data?.taskId,
    });

    // Create a safe response with validated fields
    const safeData = response.data.data || {};

    return {
      success: true,
      message: "Resume uploaded successfully",
      data: {
        ...safeData,
        _id: safeData._id || safeData.id, // Ensure _id exists
        id: safeData.id || safeData._id, // Ensure id exists
        processing: true,
        processed: false,
        taskId: safeData.taskId || safeData._id, // Fallback to _id if no taskId
        processingError: null,
      },
    };
  } catch (error: any) {
    console.error("Resume upload error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to upload resume",
      data: null,
    };
  }
};

/**
 * Get resume by ID with proper processing status handling
 */
export const getResumeById = async (id: string) => {
  try {
    if (!id) {
      throw new Error("Resume ID is required");
    }

    console.log("Fetching resume with ID:", id);

    try {
      const response = await api.get(`/resumes/${id}`);
      console.log("Get resume by ID response:", response.data);

      if (!response.data || !response.data.success) {
        throw new Error(
          response.data?.message || "Failed to fetch resume data"
        );
      }

      const resumeData = response.data.data;

      // Add minimal processed structure if we have a matchScore but no processedData
      if (resumeData && resumeData.matchScore && !resumeData.processedData) {
        console.log(
          "Resume has matchScore but no processedData, creating minimal structure"
        );
        resumeData.processedData = {
          skills: [],
          education: [],
          experience: [],
          projects: [],
        };
        resumeData.processed = true;
        resumeData.processing = false;
      }

      // If we have a job description ID, fetch the associated job description
      if (resumeData && resumeData.jobDescriptionId) {
        try {
          const jobDescResponse = await getJobDescriptionById(
            resumeData.jobDescriptionId
          );
          if (jobDescResponse.success && jobDescResponse.data) {
            resumeData.jobDescription = jobDescResponse.data;
          }
        } catch (err) {
          console.error(
            `Failed to fetch job description ${resumeData.jobDescriptionId}:`,
            err
          );
          // Don't fail the whole request if job description can't be fetched
        }
      }

      return response.data;
    } catch (apiError: any) {
      console.error("API error in getResumeById:", apiError);

      // Check for specific error status codes
      if (apiError.response) {
        const status = apiError.response.status;

        if (status === 500) {
          return {
            success: false,
            message:
              "The server encountered an internal error. This could be due to the NLP service being offline.",
            data: null,
          };
        } else if (status === 404) {
          return {
            success: false,
            message:
              "Resume not found. It may have been deleted or the ID is invalid.",
            data: null,
          };
        }
      }

      throw apiError; // Re-throw for general error handling
    }
  } catch (error: any) {
    console.error("Error fetching resume by ID:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch resume",
      data: null,
    };
  }
};

export const getAllResumes = async (jobDescriptionId?: string) => {
  try {
    const params = jobDescriptionId ? { jobDescriptionId } : {};
    const response = await api.get("/resumes", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching all resumes:", error);
    throw error;
  }
};

export const getShortlistedResumes = async (jobDescriptionId: string) => {
  try {
    const response = await api.get(`/resumes/shortlisted/${jobDescriptionId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching shortlisted resumes for job ${jobDescriptionId}:`,
      error
    );
    throw error;
  }
};

export const deleteResume = async (id: string) => {
  try {
    console.log(`Deleting resume ${id}`);
    const response = await api.delete(`/resumes/${id}`);
    console.log("Delete resume response:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error deleting resume ${id}:`, error);
    throw error;
  }
};

export const processResume = async (
  resumeId: string,
  jobDescriptionId: string
) => {
  try {
    const response = await api.post(`/resumes/${resumeId}/process`, {
      jobDescriptionId,
    });
    return response.data;
  } catch (error) {
    console.error(`Error processing resume ${resumeId}:`, error);
    throw error;
  }
};

/**
 * Check the processing status of a resume
 */
export const checkProcessingStatus = async (taskId: string) => {
  try {
    console.log(`Checking task status: ${taskId}`);

    // First try the direct NLP API
    try {
      console.log(`Trying direct NLP API first for task ${taskId}`);
      const directResponse = await fetch(`${NLP_API_URL}/api/task/${taskId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (directResponse.ok) {
        const data = await directResponse.json();
        console.log("Direct NLP API response:", data);

        if (data && (data.status === "completed" || data.status === "failed")) {
          return data;
        }
      }
    } catch (directErr) {
      console.log(
        "Direct NLP API not available, falling back to backend proxy"
      );
    }

    // If direct NLP API doesn't work, use the backend proxy
    // Encode the taskId to handle special characters
    const encodedTaskId = encodeURIComponent(taskId);
    const response = await api.get(`/resumes/task/${encodedTaskId}/status`);
    console.log("Task status response via backend:", response.data);

    // Enhanced error checking
    if (!response.data) {
      return {
        status: "failed",
        success: false,
        error: "Empty response from task status check",
      };
    }

    // Return result
    return response.data;
  } catch (error: any) {
    console.error(`Error checking task status for task ${taskId}:`, error);

    // Return a structured error response
    return {
      status: "failed",
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Unknown error checking task status",
    };
  }
};

// Direct NLP resume processing (for testing)
export const processResumeWithNLP = async (
  resumeFile: File,
  jobCategory: string,
  requiredSkills: string[]
) => {
  try {
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobCategory", jobCategory);
    if (requiredSkills && requiredSkills.length > 0) {
      formData.append("requiredSkills", requiredSkills.join(","));
    }

    const response = await nlpApi.post("/process", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error directly processing resume with NLP:", error);
    throw error;
  }
};

/**
 * Fix processing issues for a resume
 */
export const fixProcessingIssue = async (
  resumeId: string,
  force: boolean = false
) => {
  try {
    console.log(
      `Fixing processing issue for resume ${resumeId}, force: ${force}`
    );
    const response = await api.post(`/resumes/fix/${resumeId}`, { force });
    console.log("Fix processing response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Error fixing resume ${resumeId}:`, error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Failed to fix resume processing",
    };
  }
};

// Create a named API object to export
const apiService = {
  checkBackendHealth,
  checkNlpHealth,
  getJobCategories,
  getJobDescriptions,
  getJobDescriptionById,
  createJobDescription,
  updateJobDescription,
  deleteJobDescription,
  uploadResume,
  getResumeById,
  getAllResumes,
  getShortlistedResumes,
  deleteResume,
  processResume,
  checkProcessingStatus,
  processResumeWithNLP,
  fixProcessingIssue,
};

export default apiService;
