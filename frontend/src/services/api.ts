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

    return {
      success: true,
      message: "Resume uploaded successfully",
      data: {
        ...response.data,
        processing: true,
        processed: false,
        taskId: response.data.taskId || response.data._id, // Fallback to _id if no taskId
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
    const response = await api.get(`/resumes/${id}`);
    console.log("Get resume by ID response:", response.data);

    if (!response.data) {
      throw new Error("No resume data received from server");
    }

    const resumeData = response.data;

    // Ensure we have a taskId
    const taskId = resumeData.taskId || resumeData._id;
    if (!taskId) {
      throw new Error("Could not determine task ID for this resume");
    }

    // If we have processed data and it's valid, the resume is complete
    if (
      resumeData.processedData &&
      Object.keys(resumeData.processedData).length > 0 &&
      !resumeData.processingError &&
      Array.isArray(resumeData.processedData.skills)
    ) {
      console.log("Resume has valid processed data:", resumeData.processedData);
      return {
        success: true,
        data: {
          ...resumeData,
          processed: true,
          processing: false,
          processingError: null,
          taskId,
          matchScore: resumeData.matchScore || 0,
        },
      };
    }

    // If we don't have processed data but have a taskId, it's still processing
    if (resumeData.taskId || resumeData.status === "processing") {
      return {
        success: true,
        data: {
          ...resumeData,
          processed: false,
          processing: true,
          processingError: null,
          taskId: resumeData.taskId || resumeData._id, // Use _id as fallback if no taskId
        },
      };
    }

    // If we don't have a taskId but the resume exists, assume it needs processing
    return {
      success: true,
      data: {
        ...resumeData,
        processed: false,
        processing: true,
        processingError: null,
        taskId: resumeData._id, // Use _id as the taskId
      },
    };
  } catch (error: any) {
    console.error(`Error fetching resume ${id}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch resume",
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
    // First try to get the status from the NLP service
    try {
      const nlpResponse = await nlpApi.get(`/tasks/${taskId}`);
      console.log("NLP status check response:", nlpResponse.data);

      if (nlpResponse.data) {
        const status = nlpResponse.data.status?.toLowerCase();
        // If we have results, consider it completed regardless of status
        if (
          nlpResponse.data.results ||
          status === "completed" ||
          status === "success"
        ) {
          return { status: "completed", success: true };
        }
        if (status === "failed" || status === "error") {
          throw new Error(nlpResponse.data.error || "NLP processing failed");
        }
        // If state is not failed and we don't have results yet, it's still pending
        return { status: "pending", success: true };
      }
    } catch (nlpError) {
      console.error("NLP service status check failed:", nlpError);
      throw nlpError; // Let the main try-catch handle it
    }

    // Fallback: Check the resume status in the backend
    const response = await api.get(`/resumes/${taskId}`);
    console.log("Backend status check response:", response.data);

    if (
      response.data.processedData &&
      Object.keys(response.data.processedData).length > 0
    ) {
      return { status: "completed", success: true };
    }

    if (response.data.processingError) {
      return {
        status: "failed",
        success: false,
        error: response.data.processingError,
      };
    }

    return { status: "pending", success: false };
  } catch (error: any) {
    console.error("Error checking processing status:", error);
    return {
      status: "failed",
      success: false,
      error:
        error.response?.data?.message || "Failed to check processing status",
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
};

export default apiService;
