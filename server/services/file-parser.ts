import fs from 'fs';
import path from 'path';

export interface ParsedResume {
  rawText: string;
  skills: string[];
  experience: string[];
  education: string[];
  certifications: string[];
}

export class FileParserService {
  async parseResumeFile(filePath: string, mimeType: string): Promise<ParsedResume> {
    let rawText = '';

    try {
      if (mimeType === 'text/plain') {
        rawText = await this.parseTextFile(filePath);
      } else if (mimeType === 'application/pdf') {
        rawText = await this.parsePdfFile(filePath);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        rawText = await this.parseDocxFile(filePath);
      } else {
        throw new Error('Unsupported file type');
      }

      return this.extractResumeData(rawText);
    } catch (error) {
      console.error('Error parsing resume:', error);
      throw new Error('Failed to parse resume file');
    }
  }

  private async parseTextFile(filePath: string): Promise<string> {
    return fs.promises.readFile(filePath, 'utf-8');
  }

  private async parsePdfFile(filePath: string): Promise<string> {
    try {
      // For production, you would use pdf-parse library
      // For now, we'll simulate PDF parsing
      const buffer = await fs.promises.readFile(filePath);
      
      // This is a simplified simulation - in production use pdf-parse
      return buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, '');
    } catch (error) {
      throw new Error('Failed to parse PDF file');
    }
  }

  private async parseDocxFile(filePath: string): Promise<string> {
    try {
      // For production, you would use mammoth library
      // For now, we'll simulate DOCX parsing
      const buffer = await fs.promises.readFile(filePath);
      
      // This is a simplified simulation - in production use mammoth
      return buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, '');
    } catch (error) {
      throw new Error('Failed to parse DOCX file');
    }
  }

  private extractResumeData(text: string): ParsedResume {
    const skills = this.extractSkills(text);
    const experience = this.extractExperience(text);
    const education = this.extractEducation(text);
    const certifications = this.extractCertifications(text);

    return {
      rawText: text,
      skills,
      experience,
      education,
      certifications,
    };
  }

  private extractSkills(text: string): string[] {
    const skillsSection = this.findSection(text, ['skills', 'technical skills', 'technologies', 'expertise']);
    if (!skillsSection) return [];

    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java',
      'Spring', 'Django', 'Flask', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL',
      'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'REST', 'GraphQL',
      'HTML', 'CSS', 'SASS', 'Redux', 'Express', 'Jest', 'Cypress', 'Webpack'
    ];

    const foundSkills: string[] = [];
    const lowerText = skillsSection.toLowerCase();

    for (const skill of commonSkills) {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    }

    return foundSkills;
  }

  private extractExperience(text: string): string[] {
    const experienceSection = this.findSection(text, ['experience', 'work experience', 'employment', 'career']);
    if (!experienceSection) return [];

    const lines = experienceSection.split('\n').filter(line => line.trim().length > 0);
    const experience: string[] = [];

    for (const line of lines) {
      if (this.isExperienceEntry(line)) {
        experience.push(line.trim());
      }
    }

    return experience.slice(0, 5); // Limit to 5 entries
  }

  private extractEducation(text: string): string[] {
    const educationSection = this.findSection(text, ['education', 'academic background', 'qualifications']);
    if (!educationSection) return [];

    const lines = educationSection.split('\n').filter(line => line.trim().length > 0);
    const education: string[] = [];

    for (const line of lines) {
      if (this.isEducationEntry(line)) {
        education.push(line.trim());
      }
    }

    return education.slice(0, 3); // Limit to 3 entries
  }

  private extractCertifications(text: string): string[] {
    const certSection = this.findSection(text, ['certifications', 'certificates', 'licenses']);
    if (!certSection) return [];

    const lines = certSection.split('\n').filter(line => line.trim().length > 0);
    const certifications: string[] = [];

    for (const line of lines) {
      if (this.isCertificationEntry(line)) {
        certifications.push(line.trim());
      }
    }

    return certifications.slice(0, 5); // Limit to 5 entries
  }

  private findSection(text: string, sectionNames: string[]): string | null {
    const lines = text.split('\n');
    let sectionStart = -1;
    let sectionEnd = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      
      if (sectionNames.some(name => line.includes(name))) {
        sectionStart = i + 1;
        break;
      }
    }

    if (sectionStart === -1) return null;

    // Find the end of the section (next section or end of document)
    const sectionKeywords = ['experience', 'education', 'skills', 'certifications', 'projects', 'awards'];
    
    for (let i = sectionStart; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      
      if (line.length > 0 && sectionKeywords.some(keyword => 
        line.includes(keyword) && !sectionNames.some(name => line.includes(name))
      )) {
        sectionEnd = i;
        break;
      }
    }

    if (sectionEnd === -1) sectionEnd = lines.length;

    return lines.slice(sectionStart, sectionEnd).join('\n');
  }

  private isExperienceEntry(line: string): boolean {
    const patterns = [
      /\d{4}.*\d{4}/, // Year ranges
      /(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
      /\d{1,2}\/\d{4}/, // Month/Year format
    ];

    return patterns.some(pattern => pattern.test(line)) || 
           line.toLowerCase().includes('years') ||
           line.toLowerCase().includes('months');
  }

  private isEducationEntry(line: string): boolean {
    const educationKeywords = [
      'bachelor', 'master', 'phd', 'doctorate', 'associate', 'degree', 'university',
      'college', 'institute', 'school', 'certification', 'diploma'
    ];

    return educationKeywords.some(keyword => 
      line.toLowerCase().includes(keyword)
    ) || /\d{4}/.test(line);
  }

  private isCertificationEntry(line: string): boolean {
    const certKeywords = [
      'certified', 'certification', 'license', 'aws', 'azure', 'google', 'microsoft',
      'oracle', 'cisco', 'comptia', 'pmp', 'scrum'
    ];

    return certKeywords.some(keyword => 
      line.toLowerCase().includes(keyword)
    );
  }
}

export const fileParserService = new FileParserService();
