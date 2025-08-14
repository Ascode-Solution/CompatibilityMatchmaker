import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage, MongoUser, MongoAnalysisResult, MongoJobDescription, MongoResume } from "./storage";
import { authenticateToken, generateToken, type AuthRequest } from "./middleware/auth";
import { fileParserService } from "./services/file-parser";
import { nlpService } from "./services/nlp";
import { insertUserSchema, insertJobDescriptionSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure uploads directory exists
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, role = "jobseeker" } = insertUserSchema.parse(req.body);
      const existingUser = await MongoUser.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await MongoUser.create({
        email,
        password: hashedPassword,
        role,
      });
      const token = generateToken(user._id);
      res.json({
        user: { id: user._id, email: user.email, role: user.role },
        token
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await MongoUser.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = generateToken(user._id);
      res.json({
        user: { id: user._id, email: user.email, role: user.role },
        token
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });

  // Resume routes
  app.post("/api/resume/upload", authenticateToken, upload.single('resume'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const parsedResume = await fileParserService.parseResumeFile(req.file.path, req.file.mimetype);

      const resume = await MongoResume.create({
        userId: req.user!.id,
        filename: req.file.originalname,
        rawText: parsedResume.rawText,
        skills: parsedResume.skills,
        experience: parsedResume.experience,
        education: parsedResume.education,
        certifications: parsedResume.certifications,
      });

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json(resume);
    } catch (error) {
      console.error('Resume upload error:', error);
      res.status(500).json({ message: "Failed to process resume" });
    }
  });

  app.get("/api/resumes", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const resumes = await MongoResume.find({ userId: req.user!.id }).sort({ createdAt: -1 });
      res.json(resumes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resumes" });
    }
  });

  app.delete("/api/resume/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const resumeId = req.params.id;
      const resume = await MongoResume.findById(resumeId);
      if (!resume || resume.userId.toString() !== req.user!.id.toString()) {
        return res.status(404).json({ message: "Resume not found" });
      }
      await MongoResume.findByIdAndDelete(resumeId);
      res.json({ message: "Resume deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete resume" });
    }
  });

  // Job description routes
  app.post("/api/job-description", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const jobData = insertJobDescriptionSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      // Extract required skills from description if not provided
      if (!jobData.requiredSkills || jobData.requiredSkills.length === 0) {
        const skills = extractSkillsFromText(jobData.description);
        jobData.requiredSkills = skills;
      }

      const jobDescription = await MongoJobDescription.create(jobData);
      res.json(jobDescription);
    } catch (error) {
      console.error('Job description creation error:', error);
      res.status(400).json({ message: "Invalid job description data" });
    }
  });

  app.get("/api/job-descriptions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const jobDescriptions = await MongoJobDescription.find({ userId: req.user!.id }).sort({ createdAt: -1 });
      res.json(jobDescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job descriptions" });
    }
  });

  app.delete("/api/job-description/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const jobDescriptionId = req.params.id;
      const jobDescription = await MongoJobDescription.findById(jobDescriptionId);
      if (!jobDescription || jobDescription.userId.toString() !== req.user!.id.toString()) {
        return res.status(404).json({ message: "Job description not found" });
      }
      await MongoJobDescription.findByIdAndDelete(jobDescriptionId);
      res.json({ message: "Job description deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job description" });
    }
  });

  // Analysis routes
  app.post("/api/analyze", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { resumeId, jobDescriptionId } = req.body;

      const resume = await MongoResume.findById(resumeId);
      const jobDescription = await MongoJobDescription.findById(jobDescriptionId);

      if (!resume || resume.userId.toString() !== req.user!.id.toString()) {
        return res.status(404).json({ message: "Resume not found" });
      }

      if (!jobDescription || jobDescription.userId.toString() !== req.user!.id.toString()) {
        return res.status(404).json({ message: "Job description not found" });
      }

      const analysisScores = nlpService.analyzeCompatibility(
        resume.rawText,
        jobDescription.description,
        resume.skills || [],
        resume.experience || [],
        resume.education || [],
        jobDescription.requiredSkills || []
      );

      // Save analysis result in MongoDB
      const analysisResult = await MongoAnalysisResult.create({
        userId: req.user!.id,
        resumeId,
        jobDescriptionId,
        overallScore: analysisScores.overallScore,
        skillsScore: analysisScores.skillsScore,
        experienceScore: analysisScores.experienceScore,
        educationScore: analysisScores.educationScore,
        missingSkills: analysisScores.missingSkills,
        recommendations: analysisScores.recommendations,
        jobTitle: jobDescription.title,
        company: jobDescription.company,
      });

      res.json({
        ...analysisResult.toObject(),
        jobTitle: jobDescription.title,
        company: jobDescription.company,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ message: "Failed to perform analysis" });
    }
  });

  app.get("/api/analysis/history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Find all analysis results for this user
      const analysisResults = await MongoAnalysisResult.find({ userId: req.user!.id }).sort({ createdAt: -1 });
      res.json(analysisResults);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analysis history" });
    }
  });

  app.delete("/api/analysis/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      const analysis = await storage.getAnalysisResult(analysisId);
      
      if (!analysis || analysis.userId !== req.user!.id) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      await storage.deleteAnalysisResult(analysisId);
      res.json({ message: "Analysis deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete analysis" });
    }
  });

  // Statistics route
  app.get("/api/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getUserStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to extract skills from text
function extractSkillsFromText(text: string): string[] {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java',
    'Spring', 'Django', 'Flask', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL',
    'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'REST', 'GraphQL',
    'HTML', 'CSS', 'SASS', 'Redux', 'Express', 'Jest', 'Cypress'
  ];

  const foundSkills: string[] = [];
  const lowerText = text.toLowerCase();

  for (const skill of commonSkills) {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }

  return foundSkills;
}
