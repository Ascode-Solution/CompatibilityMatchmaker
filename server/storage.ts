import {
  users,
  resumes,
  jobDescriptions,
  analysisResults,
  type User,
  type InsertUser,
  type Resume,
  type InsertResume,
  type JobDescription,
  type InsertJobDescription,
  type AnalysisResult,
  type InsertAnalysisResult,
} from "@shared/schema";
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://instructorali123:ZLrhaYQgc6Ync@cluster0.xus1zye.mongodb.net/crm-system?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
mongoose.connect(MONGO_URI, { dbName: "crm-system" })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "jobseeker" },
  createdAt: { type: Date, default: Date.now },
});
export const MongoUser = mongoose.models.User || mongoose.model("User", userSchema);

// Analysis Result Schema
const analysisResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  resumeId: { type: Number },
  jobDescriptionId: { type: Number },
  overallScore: { type: Number },
  skillsScore: { type: Number },
  experienceScore: { type: Number },
  educationScore: { type: Number },
  missingSkills: [{ type: String }],
  recommendations: [{ type: String }],
  jobTitle: { type: String },
  company: { type: String },
  createdAt: { type: Date, default: Date.now },
});
export const MongoAnalysisResult = mongoose.models.AnalysisResult || mongoose.model("AnalysisResult", analysisResultSchema);

// Job Description Schema
const jobDescriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  company: { type: String },
  description: { type: String, required: true },
  requiredSkills: [{ type: String }],
  experienceLevel: { type: String },
  education: { type: String },
  createdAt: { type: Date, default: Date.now },
});
export const MongoJobDescription = mongoose.models.JobDescription || mongoose.model("JobDescription", jobDescriptionSchema);

// Resume Schema
const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: { type: String },
  rawText: { type: String },
  skills: [{ type: String }],
  experience: [{ type: String }],
  education: [{ type: String }],
  certifications: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});
export const MongoResume = mongoose.models.Resume || mongoose.model("Resume", resumeSchema);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Resume methods
  getResume(id: number): Promise<Resume | undefined>;
  getResumesByUserId(userId: number): Promise<Resume[]>;
  createResume(resume: InsertResume): Promise<Resume>;
  deleteResume(id: number): Promise<void>;
  
  // Job description methods
  getJobDescription(id: number): Promise<JobDescription | undefined>;
  getJobDescriptionsByUserId(userId: number): Promise<JobDescription[]>;
  createJobDescription(jobDescription: InsertJobDescription): Promise<JobDescription>;
  deleteJobDescription(id: number): Promise<void>;
  
  // Analysis result methods
  getAnalysisResult(id: number): Promise<AnalysisResult | undefined>;
  getAnalysisResultsByUserId(userId: number): Promise<AnalysisResult[]>;
  createAnalysisResult(analysisResult: InsertAnalysisResult): Promise<AnalysisResult>;
  deleteAnalysisResult(id: number): Promise<void>;
  
  // Statistics
  getUserStats(userId: number): Promise<{
    totalAnalyses: number;
    averageMatch: number;
    highMatches: number;
    skillsGaps: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private resumes: Map<number, Resume>;
  private jobDescriptions: Map<number, JobDescription>;
  private analysisResults: Map<number, AnalysisResult>;
  private currentUserId: number;
  private currentResumeId: number;
  private currentJobDescriptionId: number;
  private currentAnalysisResultId: number;

  constructor() {
    this.users = new Map();
    this.resumes = new Map();
    this.jobDescriptions = new Map();
    this.analysisResults = new Map();
    this.currentUserId = 1;
    this.currentResumeId = 1;
    this.currentJobDescriptionId = 1;
    this.currentAnalysisResultId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "jobseeker",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getResume(id: number): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }

  async getResumesByUserId(userId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values()).filter((resume) => resume.userId === userId);
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = this.currentResumeId++;
    const resume: Resume = {
      ...insertResume,
      id,
      skills: insertResume.skills || null,
      experience: insertResume.experience || null,
      education: insertResume.education || null,
      certifications: insertResume.certifications || null,
      createdAt: new Date(),
    };
    this.resumes.set(id, resume);
    return resume;
  }

  async deleteResume(id: number): Promise<void> {
    this.resumes.delete(id);
  }

  async getJobDescription(id: number): Promise<JobDescription | undefined> {
    return this.jobDescriptions.get(id);
  }

  async getJobDescriptionsByUserId(userId: number): Promise<JobDescription[]> {
    return Array.from(this.jobDescriptions.values()).filter((jd) => jd.userId === userId);
  }

  async createJobDescription(insertJobDescription: InsertJobDescription): Promise<JobDescription> {
    const id = this.currentJobDescriptionId++;
    const jobDescription: JobDescription = {
      ...insertJobDescription,
      id,
      company: insertJobDescription.company || null,
      requiredSkills: insertJobDescription.requiredSkills || null,
      experienceLevel: insertJobDescription.experienceLevel || null,
      education: insertJobDescription.education || null,
      createdAt: new Date(),
    };
    this.jobDescriptions.set(id, jobDescription);
    return jobDescription;
  }

  async deleteJobDescription(id: number): Promise<void> {
    this.jobDescriptions.delete(id);
  }

  async getAnalysisResult(id: number): Promise<AnalysisResult | undefined> {
    return this.analysisResults.get(id);
  }

  async getAnalysisResultsByUserId(userId: number): Promise<AnalysisResult[]> {
    return Array.from(this.analysisResults.values())
      .filter((result) => result.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAnalysisResult(insertAnalysisResult: InsertAnalysisResult): Promise<AnalysisResult> {
    const id = this.currentAnalysisResultId++;
    const analysisResult: AnalysisResult = {
      ...insertAnalysisResult,
      id,
      missingSkills: insertAnalysisResult.missingSkills || null,
      recommendations: insertAnalysisResult.recommendations || null,
      createdAt: new Date(),
    };
    this.analysisResults.set(id, analysisResult);
    return analysisResult;
  }

  async deleteAnalysisResult(id: number): Promise<void> {
    this.analysisResults.delete(id);
  }

  async getUserStats(userId: number): Promise<{
    totalAnalyses: number;
    averageMatch: number;
    highMatches: number;
    skillsGaps: number;
  }> {
    const userAnalyses = Array.from(this.analysisResults.values()).filter(
      (result) => result.userId === userId
    );

    const totalAnalyses = userAnalyses.length;
    const averageMatch = totalAnalyses > 0 
      ? Math.round(userAnalyses.reduce((sum, result) => sum + result.overallScore, 0) / totalAnalyses)
      : 0;
    const highMatches = userAnalyses.filter((result) => result.overallScore >= 80).length;
    const skillsGaps = totalAnalyses > 0 
      ? userAnalyses[userAnalyses.length - 1].missingSkills?.length || 0
      : 0;

    return {
      totalAnalyses,
      averageMatch,
      highMatches,
      skillsGaps,
    };
  }
}

export const storage = new MemStorage();
