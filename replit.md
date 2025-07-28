# Business Management System with AI Document Processing

## Overview

This is a full-stack business management application built with React/TypeScript frontend and Express.js backend. The system provides comprehensive inventory management, sales tracking, purchasing workflows, and AI-powered document processing capabilities. It features a modern dashboard interface with real-time analytics and automated document analysis using OpenAI's GPT models.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for development and production builds
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured error handling
- **File Processing**: Multer for multipart/form-data handling
- **AI Integration**: OpenAI API for document analysis

### Data Storage Solutions
- **Database**: PostgreSQL (configured via Drizzle)
- **ORM**: Drizzle ORM with schema-first approach
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Migrations**: Drizzle Kit for schema management
- **Session Management**: PostgreSQL-based sessions via connect-pg-simple

## Key Components

### Core Business Modules
1. **Dashboard**: Real-time business metrics and analytics
2. **Products**: Inventory management with categories and suppliers
3. **Sales**: Transaction recording with line items and customer data
4. **Purchases**: Supplier ordering and receiving workflows
5. **Suppliers**: Vendor contact and relationship management
6. **Inventory**: Stock level monitoring with low-stock alerts
7. **Reports**: Business intelligence and data visualization

### AI Document Processing
- **Document Upload**: Drag-and-drop interface with file validation
- **AI Analysis**: Google Gemini AI for automated extraction of vendor, amount, date, and category data
- **Review Workflow**: Manual validation and correction interface
- **Status Tracking**: Processing states (pending, processing, completed, failed)
- **Data Integration**: Automatic creation of business records from approved documents

### UI Component System
- **Design System**: Radix UI primitives with shadcn/ui styling
- **Theme**: CSS variables-based theming with light/dark mode support
- **Responsive Design**: Mobile-first approach with breakpoint-aware components
- **Charts**: Recharts for data visualization (revenue trends, analytics)

## Data Flow

### Document Processing Workflow
1. User uploads document via drag-and-drop interface
2. Backend receives file and initiates OpenAI analysis
3. AI extracts structured data (vendor, amount, category, date)
4. Results stored with processing status
5. User reviews and corrects extracted data
6. Approved documents create corresponding business records

### Business Transaction Flow
1. Sales/Purchase forms collect transaction details
2. Line items track individual products with quantities and prices
3. Inventory levels automatically updated on transaction completion
4. Dashboard metrics refresh to reflect new data
5. Reports aggregate data for business intelligence

### Authentication & Sessions
- Session-based authentication using PostgreSQL storage
- Middleware-based request logging and error handling
- CORS and security headers configured for production

## External Dependencies

### AI Services
- **Google Gemini API**: Gemini-2.5-pro model for document analysis and data extraction
- **File Processing**: 10MB upload limit with memory storage

### Database Services
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Database URL**: Environment variable configuration

### Development Tools
- **Replit Integration**: Cartographer plugin for development environment
- **Error Handling**: Runtime error overlay for debugging
- **Hot Reload**: Vite HMR with Express middleware integration

### UI Libraries
- **Icons**: Lucide React for consistent iconography
- **Charts**: Recharts for data visualization
- **Date Handling**: date-fns for date manipulation
- **Validation**: Zod for runtime type checking

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Assets**: Static file serving via Express in production

### Environment Configuration
- **Development**: Hot reload with Vite middleware
- **Production**: Static file serving with optimized builds
- **Database**: Environment-based connection string configuration

### File Structure
- `client/`: Frontend React application
- `server/`: Backend Express application  
- `shared/`: Common TypeScript types and schemas
- `migrations/`: Database migration files
- Root-level config files for build tools and dependencies

The application follows a modern full-stack architecture with clear separation of concerns, type safety throughout, and production-ready deployment configuration.