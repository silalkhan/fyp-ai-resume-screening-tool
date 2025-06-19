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
  updatedAt?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  year?: string;
}

export interface Experience {
  company: string;
  position: string;
  duration?: string;
  description?: string;
}

export interface Project {
  title: string;
  description?: string;
  technologies?: string[];
  duration?: string;
}

export interface ProcessedData {
  skills: string[];
  education: Education[];
  experience: Experience[];
  projects?: Project[];
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  linkedin?: string;
  website?: string;
  location?: string;
}

export interface Resume {
  _id: string;
  fileName: string;
  candidateName?: string;
  filePath: string;
  uploadDate: string;
  processedData?: ProcessedData;
  taskId?: string;
  matchScore?: number;
  shortlisted?: boolean;
  processed: boolean;
  processing: boolean;
  processingError: string | null;
  jobDescriptionId?: string;
  status?: string;
  // File metadata
  originalFilename?: string;
  mimeType?: string;
  fileSize?: number;
  pageCount?: number;
  // Contact information
  contactInfo?: ContactInfo;
  // Job description reference
  jobDescription?: JobDescription;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
