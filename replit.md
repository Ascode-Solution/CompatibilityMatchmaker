# ResumeMatch - AI-Powered Resume Analysis Platform

## Overview

ResumeMatch is a full-stack web application that uses Natural Language Processing (NLP) to analyze the compatibility between candidate resumes and job descriptions. The platform provides intelligent insights to help job seekers optimize their resumes and understand their match potential with specific roles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: JWT-based with bcrypt for password hashing
- **File Upload**: Multer for handling resume uploads
- **API Design**: RESTful endpoints with consistent error handling

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle migrations and type-safe queries
- **File Storage**: Local filesystem for uploaded documents

## Key Components

### Authentication System
- JWT-based authentication with secure token storage
- Role-based access control (jobseeker, employer, admin)
- Password hashing using bcryptjs
- Protected routes with authentication middleware

### File Processing Pipeline
- Multi-format support (PDF, DOCX, TXT)
- Resume text extraction and parsing
- Automatic skill, experience, and education detection
- File validation and size limits (10MB)

### NLP Analysis Engine
- Natural language processing using the `natural` library
- TF-IDF based document similarity analysis
- Skill matching algorithms
- Experience level assessment
- Education compatibility scoring

### User Interface Components
- Responsive design with mobile-first approach
- Modular UI components using shadcn/ui
- Interactive dashboards with statistics
- Progress indicators and score visualizations
- File upload with drag-and-drop functionality

## Data Flow

1. **User Authentication**: Users sign up/login through JWT-based system
2. **Resume Upload**: Files are uploaded, validated, and parsed for content extraction
3. **Job Description Input**: Users can manually enter or upload job descriptions
4. **NLP Analysis**: The system processes both documents through similarity algorithms
5. **Score Calculation**: Multiple compatibility scores are generated (skills, experience, education)
6. **Results Display**: Interactive dashboard shows detailed analysis and recommendations
7. **History Tracking**: All analyses are stored for future reference and trend analysis

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Runtime type validation
- **natural**: Natural language processing

### UI Framework
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **eslint**: Code linting
- **tsx**: TypeScript execution

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- Node.js server with automatic restarts
- Environment-based configuration
- Replit-specific optimizations for cloud development

### Production Build
- Frontend: Vite builds optimized React bundle
- Backend: esbuild bundles Node.js server
- Static assets served from Express
- Environment variables for database and JWT secrets

### Database Strategy
- Drizzle migrations for schema changes
- Connection pooling through Neon's serverless driver
- Automated backups and scaling
- Type-safe database operations

### File Management
- Local storage for uploaded files during development
- Structured upload directory with file type validation
- Automatic cleanup for temporary files
- Security measures for file access

The application follows a modern full-stack architecture with emphasis on type safety, performance, and user experience. The modular design allows for easy extension of features and maintenance of the codebase.