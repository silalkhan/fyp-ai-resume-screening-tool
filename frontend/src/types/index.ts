export interface JobCategory {
  id: string;
  name: string;
  description: string;
}

export interface JobDescription {
  _id: string;
  title: string;
  category: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredExperience: number;
  createdAt: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
}

export interface Project {
  title: string;
  description: string;
  technologies: string[];
  duration: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  location?: string;
}

export interface ProcessedData {
  skills: string[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
}

export interface Resume {
  _id: string;
  originalFilename: string;
  storedFilename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  candidateName: string;
  contactInfo: ContactInfo;
  processed: boolean;
  processing?: boolean;
  processingError?: string | null;
  taskId?: string;
  jobDescriptionId: string;
  jobDescription?: JobDescription;
  processedData: ProcessedData;
  matchScore: number;
  shortlisted: boolean;
  fileName?: string;
}

export interface ResumeFormData {
  resume: File;
  jobDescriptionId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

export interface TaskStatus {
  success: boolean;
  status: "pending" | "completed" | "failed";
  error?: string;
  result?: {
    success: boolean;
    data: {
      candidateName: string;
      contactInfo: ContactInfo;
      skills: string[];
      education: Education[];
      experience: Experience[];
      projects: Project[];
      matchScore: number;
    };
  };
}
