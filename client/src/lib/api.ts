import { apiRequest } from "./queryClient";
import type { Resume, JobDescription, AnalysisResult } from "@shared/schema";

export const resumeApi = {
  upload: async (file: File): Promise<Resume> => {
    const formData = new FormData();
    formData.append("resume", file);
    
    const response = await fetch("/api/resume/upload", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to upload resume");
    }
    
    return response.json();
  },

  getAll: async (): Promise<Resume[]> => {
    const response = await apiRequest("GET", "/api/resumes");
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/resume/${id}`);
  },
};

export const jobDescriptionApi = {
  create: async (jobData: {
    title: string;
    company?: string;
    description: string;
    requiredSkills?: string[];
    experienceLevel?: string;
    education?: string;
  }): Promise<JobDescription> => {
    const response = await apiRequest("POST", "/api/job-description", jobData);
    return response.json();
  },

  getAll: async (): Promise<JobDescription[]> => {
    const response = await apiRequest("GET", "/api/job-descriptions");
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/job-description/${id}`);
  },
};

export const analysisApi = {
  analyze: async (resumeId: number, jobDescriptionId: number): Promise<AnalysisResult & { jobTitle: string; company?: string }> => {
    const response = await apiRequest("POST", "/api/analyze", {
      resumeId,
      jobDescriptionId,
    });
    return response.json();
  },

  getHistory: async (): Promise<(AnalysisResult & { jobTitle: string; company?: string })[]> => {
    const response = await apiRequest("GET", "/api/analysis/history");
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/analysis/${id}`);
  },
};

export const statsApi = {
  getUserStats: async (): Promise<{
    totalAnalyses: number;
    averageMatch: number;
    highMatches: number;
    skillsGaps: number;
  }> => {
    const response = await apiRequest("GET", "/api/stats");
    return response.json();
  },
};
