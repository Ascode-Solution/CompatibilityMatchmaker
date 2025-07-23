import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("jobseeker"), // jobseeker | employer | admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  filename: text("filename").notNull(),
  rawText: text("raw_text").notNull(),
  skills: text("skills").array(),
  experience: text("experience").array(),
  education: text("education").array(),
  certifications: text("certifications").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobDescriptions = pgTable("job_descriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  company: text("company"),
  description: text("description").notNull(),
  requiredSkills: text("required_skills").array(),
  experienceLevel: text("experience_level"),
  education: text("education"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  resumeId: integer("resume_id").notNull(),
  jobDescriptionId: integer("job_description_id").notNull(),
  overallScore: integer("overall_score").notNull(),
  skillsScore: integer("skills_score").notNull(),
  experienceScore: integer("experience_score").notNull(),
  educationScore: integer("education_score").notNull(),
  missingSkills: text("missing_skills").array(),
  recommendations: text("recommendations").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
});

export const insertResumeSchema = createInsertSchema(resumes).pick({
  userId: true,
  filename: true,
  rawText: true,
  skills: true,
  experience: true,
  education: true,
  certifications: true,
});

export const insertJobDescriptionSchema = createInsertSchema(jobDescriptions).pick({
  userId: true,
  title: true,
  company: true,
  description: true,
  requiredSkills: true,
  experienceLevel: true,
  education: true,
});

export const insertAnalysisResultSchema = createInsertSchema(analysisResults).pick({
  userId: true,
  resumeId: true,
  jobDescriptionId: true,
  overallScore: true,
  skillsScore: true,
  experienceScore: true,
  educationScore: true,
  missingSkills: true,
  recommendations: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type JobDescription = typeof jobDescriptions.$inferSelect;
export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;
