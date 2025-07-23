import natural from 'natural';

const { TfIdf, PorterStemmer, WordTokenizer } = natural;

export interface AnalysisScores {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  missingSkills: string[];
  recommendations: string[];
}

export class NLPService {
  private tokenizer: any;
  private tfidf: any;

  constructor() {
    this.tokenizer = new WordTokenizer();
    this.tfidf = new TfIdf();
  }

  analyzeCompatibility(
    resumeText: string,
    jobDescription: string,
    resumeSkills: string[] = [],
    resumeExperience: string[] = [],
    resumeEducation: string[] = [],
    requiredSkills: string[] = []
  ): AnalysisScores {
    // Clean and tokenize texts
    const cleanResumeText = this.cleanText(resumeText);
    const cleanJobText = this.cleanText(jobDescription);

    // Add documents to TF-IDF
    this.tfidf.addDocument(cleanResumeText);
    this.tfidf.addDocument(cleanJobText);

    // Calculate overall semantic similarity
    const overallScore = this.calculateSemanticSimilarity(cleanResumeText, cleanJobText);

    // Calculate section-specific scores
    const skillsScore = this.calculateSkillsMatch(resumeSkills, requiredSkills, cleanJobText);
    const experienceScore = this.calculateExperienceMatch(resumeExperience, cleanJobText);
    const educationScore = this.calculateEducationMatch(resumeEducation, cleanJobText);

    // Find missing skills
    const missingSkills = this.findMissingSkills(resumeSkills, requiredSkills, cleanJobText);

    // Generate recommendations
    const recommendations = this.generateRecommendations(missingSkills, skillsScore, experienceScore);

    return {
      overallScore: Math.round((overallScore + skillsScore + experienceScore + educationScore) / 4),
      skillsScore: Math.round(skillsScore),
      experienceScore: Math.round(experienceScore),
      educationScore: Math.round(educationScore),
      missingSkills,
      recommendations,
    };
  }

  private cleanText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateSemanticSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(this.tokenizer.tokenize(text1) || []);
    const tokens2 = new Set(this.tokenizer.tokenize(text2) || []);

    const tokens1Array = Array.from(tokens1);
    const tokens2Array = Array.from(tokens2);
    
    const intersection = new Set(tokens1Array.filter(x => tokens2.has(x)));
    const union = new Set([...tokens1Array, ...tokens2Array]);

    return (intersection.size / union.size) * 100;
  }

  private calculateSkillsMatch(resumeSkills: string[], requiredSkills: string[], jobText: string): number {
    if (requiredSkills.length === 0) return 85; // Default if no specific skills required

    let matchCount = 0;
    const normalizedResumeSkills = resumeSkills.map(skill => skill.toLowerCase());
    const normalizedJobText = jobText.toLowerCase();

    for (const skill of requiredSkills) {
      const normalizedSkill = skill.toLowerCase();
      
      // Direct match in resume skills
      if (normalizedResumeSkills.some(resumeSkill => 
        resumeSkill.includes(normalizedSkill) || normalizedSkill.includes(resumeSkill)
      )) {
        matchCount++;
        continue;
      }

      // Check if skill appears in job description context
      if (normalizedJobText.includes(normalizedSkill)) {
        // Check for synonyms or related terms
        const relatedTerms = this.getRelatedTerms(normalizedSkill);
        if (relatedTerms.some(term => normalizedResumeSkills.some(resumeSkill => 
          resumeSkill.includes(term) || term.includes(resumeSkill)
        ))) {
          matchCount += 0.7; // Partial match for related terms
        }
      }
    }

    return Math.min((matchCount / requiredSkills.length) * 100, 100);
  }

  private calculateExperienceMatch(resumeExperience: string[], jobText: string): number {
    if (resumeExperience.length === 0) return 60; // Default if no experience data

    const experienceKeywords = ['years', 'experience', 'worked', 'developed', 'managed', 'led', 'built'];
    let matchScore = 70; // Base score

    const jobExperienceLevel = this.extractExperienceLevel(jobText);
    const resumeYears = this.extractYearsOfExperience(resumeExperience.join(' '));

    if (jobExperienceLevel && resumeYears) {
      if (resumeYears >= jobExperienceLevel) {
        matchScore = 90;
      } else if (resumeYears >= jobExperienceLevel - 1) {
        matchScore = 80;
      } else {
        matchScore = 60;
      }
    }

    return matchScore;
  }

  private calculateEducationMatch(resumeEducation: string[], jobText: string): number {
    if (resumeEducation.length === 0) return 70; // Default if no education data

    const educationLevels = {
      'phd': 5,
      'doctorate': 5,
      'masters': 4,
      'master': 4,
      'bachelor': 3,
      'associate': 2,
      'diploma': 1,
      'certificate': 1
    };

    let resumeLevel = 0;
    let jobLevel = 0;

    // Extract education level from resume
    for (const education of resumeEducation) {
      for (const [level, value] of Object.entries(educationLevels)) {
        if (education.toLowerCase().includes(level)) {
          resumeLevel = Math.max(resumeLevel, value);
        }
      }
    }

    // Extract education level from job description
    for (const [level, value] of Object.entries(educationLevels)) {
      if (jobText.toLowerCase().includes(level)) {
        jobLevel = Math.max(jobLevel, value);
      }
    }

    if (jobLevel === 0) return 85; // No specific requirement

    if (resumeLevel >= jobLevel) {
      return 95;
    } else if (resumeLevel === jobLevel - 1) {
      return 80;
    } else {
      return 65;
    }
  }

  private findMissingSkills(resumeSkills: string[], requiredSkills: string[], jobText: string): string[] {
    const missing: string[] = [];
    const normalizedResumeSkills = resumeSkills.map(skill => skill.toLowerCase());

    for (const skill of requiredSkills) {
      const normalizedSkill = skill.toLowerCase();
      
      if (!normalizedResumeSkills.some(resumeSkill => 
        resumeSkill.includes(normalizedSkill) || normalizedSkill.includes(resumeSkill)
      )) {
        missing.push(skill);
      }
    }

    // Also extract important skills from job description
    const importantTerms = this.extractImportantTerms(jobText);
    for (const term of importantTerms) {
      if (!normalizedResumeSkills.some(skill => skill.includes(term.toLowerCase())) && 
          !missing.some(skill => skill.toLowerCase().includes(term.toLowerCase()))) {
        missing.push(term);
      }
    }

    return missing.slice(0, 5); // Limit to top 5 missing skills
  }

  private generateRecommendations(missingSkills: string[], skillsScore: number, experienceScore: number): string[] {
    const recommendations: string[] = [];

    if (missingSkills.length > 0) {
      recommendations.push(`Add experience with: ${missingSkills.slice(0, 3).join(', ')}`);
    }

    if (skillsScore < 70) {
      recommendations.push('Highlight more relevant technical skills in your resume');
    }

    if (experienceScore < 70) {
      recommendations.push('Emphasize relevant work experience and achievements');
    }

    recommendations.push('Tailor your resume keywords to match the job description');
    recommendations.push('Include specific examples of your accomplishments');

    return recommendations.slice(0, 4);
  }

  private getRelatedTerms(skill: string): string[] {
    const synonyms: { [key: string]: string[] } = {
      'javascript': ['js', 'node', 'react', 'vue', 'angular'],
      'python': ['django', 'flask', 'pandas', 'numpy'],
      'java': ['spring', 'hibernate', 'maven'],
      'react': ['jsx', 'redux', 'hooks'],
      'database': ['sql', 'mysql', 'postgresql', 'mongodb'],
      'aws': ['cloud', 'ec2', 's3', 'lambda'],
    };

    return synonyms[skill] || [];
  }

  private extractExperienceLevel(text: string): number | null {
    const patterns = [
      /(\d+)[\+\-\s]*years?\s*(?:of\s*)?experience/i,
      /(\d+)[\+\-\s]*yrs?\s*(?:of\s*)?experience/i,
      /minimum\s*(\d+)\s*years?/i,
      /at\s*least\s*(\d+)\s*years?/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return null;
  }

  private extractYearsOfExperience(text: string): number | null {
    const patterns = [
      /(\d+)[\+\-\s]*years?\s*(?:of\s*)?experience/i,
      /(\d+)[\+\-\s]*yrs?\s*experience/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return null;
  }

  private extractImportantTerms(text: string): string[] {
    const techTerms = [
      'typescript', 'javascript', 'react', 'vue', 'angular', 'python', 'java',
      'spring', 'django', 'flask', 'sql', 'nosql', 'mongodb', 'postgresql',
      'aws', 'azure', 'docker', 'kubernetes', 'git', 'ci/cd', 'api', 'rest',
      'graphql', 'microservices', 'agile', 'scrum', 'testing', 'jest', 'cypress'
    ];

    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const term of techTerms) {
      if (lowerText.includes(term)) {
        found.push(term);
      }
    }

    return found;
  }
}

export const nlpService = new NLPService();
