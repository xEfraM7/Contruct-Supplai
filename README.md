# 🏗️ SupplAI - Construction Management & AI Blueprint Analysis Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat&logo=supabase)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-orange?style=flat&logo=openai)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A modern construction management platform powered by AI that analyzes blueprints, manages equipment inventory, tracks projects, and provides intelligent cost estimation.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Key Features Explained](#key-features-explained)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## 🎯 Overview

SupplAI is a comprehensive construction management platform that leverages artificial intelligence to streamline construction workflows. The platform analyzes architectural blueprints, provides cost estimations based on your inventory, identifies discrepancies, generates RFIs (Requests for Information), and helps manage equipment, clients, and projects all in one place.

### Why SupplAI?

- **AI-Powered Blueprint Analysis**: Upload construction plans and get instant takeoffs, cost estimates, and technical insights
- **Inventory-Based Costing**: Automatically matches blueprint requirements with your existing equipment inventory
- **Smart Project Management**: Track projects, clients, schedules, and equipment in real-time
- **Voice AI Integration**: Retell AI integration for voice-based interactions
- **Professional Reports**: Generate detailed technical reports with discrepancies and RFIs

## ✨ Features

### 🤖 AI Blueprint Analysis
- Upload PDF blueprints for automated analysis
- GPT-5 powered technical review
- Automatic quantity takeoffs
- Cost estimation based on inventory
- Discrepancy detection
- RFI generation
- Category-specific analysis (Electrical, Plumbing, HVAC, etc.)

### 📦 Equipment Management
- Complete inventory tracking
- Equipment categorization
- Status monitoring (Available, In Use, Maintenance)
- Location tracking
- Value and quantity management
- Equipment checkout system

### 👥 Client & Project Management
- Client database with contact information
- Project tracking and status updates
- Budget management
- Timeline visualization
- Project-client associations

### 📊 Analytics Dashboard
- Real-time metrics and KPIs
- Equipment utilization charts
- Project status overview
- Cost analysis
- Interactive data visualizations with Recharts

### 🗓️ Schedule Management
- Project timeline tracking
- Equipment scheduling
- Resource allocation
- Calendar view

### 🎙️ AI Voice Agent
- Retell AI integration
- Voice-based interactions
- Call management
- Automated responses

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: TanStack Query (React Query)

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Better Auth + Supabase Auth
- **File Storage**: Supabase Storage
- **AI**: OpenAI GPT-4o with Assistants API

### DevOps & Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Build Tool**: Turbopack
- **Version Control**: Git

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Git**: Latest version
- **Supabase Account**: [Sign up here](https://supabase.com/)
- **OpenAI API Key**: [Get one here](https://platform.openai.com/)
- **Google OAuth Credentials**: [Google Cloud Console](https://console.cloud.google.com/)
- **Retell AI Account** (Optional): [Sign up here](https://www.retellai.com/)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/supplai.git
cd supplai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials (see [Environment Variables](#environment-variables) section).

### 4. Set Up Supabase Database

Run the database migrations (see [Database Setup](#database-setup) section).

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Retell AI (Optional)
RETELL_API_KEY=your-retell-api-key
RETELL_PHONE_NUMBER=+1234567890
```

### How to Get These Keys

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new secret key
5. Ensure you have GPT-4 access

#### Supabase
1. Create account at [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Project Settings > API
4. Copy the Project URL and anon/public key

#### Retell AI (Optional)
1. Sign up at [Retell AI](https://www.retellai.com/)
2. Get your API key from dashboard
3. Set up a phone number

## 🗄️ Database Setup

### Supabase Tables Required

Your Supabase database should have the following tables:

#### 1. `equipment` Table
```sql
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tag TEXT,
  category TEXT,
  status TEXT DEFAULT 'available',
  location TEXT,
  value DECIMAL(10, 2),
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `blueprints` Table
```sql
CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'pending',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. `blueprint_analyses` Table
```sql
CREATE TABLE blueprint_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_result TEXT,
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `clients` Table
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. `projects` Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning',
  budget DECIMAL(12, 2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage Buckets

Create a storage bucket in Supabase:

1. Go to Storage in Supabase Dashboard
2. Create a new bucket named `blueprints`
3. Set it to public or configure RLS policies

### Row Level Security (RLS)

Enable RLS on all tables and create policies:

```sql
-- Example for equipment table
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own equipment"
  ON equipment FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own equipment"
  ON equipment FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment"
  ON equipment FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own equipment"
  ON equipment FOR DELETE
  USING (auth.uid() = user_id);
```

Repeat similar policies for other tables.

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

Runs the app with Turbopack for faster development.

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 📁 Project Structure

```
supplai/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (dashboard)/          # Dashboard routes (grouped)
│   │   │   ├── agents/           # AI agents management
│   │   │   ├── analytics/        # Analytics dashboard
│   │   │   ├── blueprints/       # Blueprint management
│   │   │   ├── clients/          # Client management
│   │   │   ├── equipment/        # Equipment inventory
│   │   │   ├── overview/         # Dashboard overview
│   │   │   ├── schedule/         # Schedule management
│   │   │   └── settings/         # User settings
│   │   ├── api/                  # API routes
│   │   │   ├── agents/           # Agent API endpoints
│   │   │   ├── analyze-blueprints/ # Blueprint analysis
│   │   │   ├── auth/             # Authentication
│   │   │   ├── blueprints/       # Blueprint CRUD
│   │   │   ├── clients/          # Client CRUD
│   │   │   ├── equipment/        # Equipment CRUD
│   │   │   └── projects/         # Project CRUD
│   │   ├── auth/                 # Auth pages
│   │   ├── login/                # Login page
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page
│   ├── components/               # React components
│   │   ├── ui/                   # UI components (Radix)
│   │   └── ...                   # Feature components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utility libraries
│   │   ├── openAI.ts             # OpenAI configuration
│   │   ├── supabase/             # Supabase clients
│   │   └── utils.ts              # Helper functions
│   ├── providers/                # Context providers
│   ├── types/                    # TypeScript types
│   └── middleware.ts             # Next.js middleware
├── public/                       # Static assets
├── .env.example                  # Environment variables template
├── .env.local                    # Local environment (gitignored)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

## 📚 API Documentation

### Blueprint Analysis API

**Endpoint**: `POST /api/analyze-blueprints`

**Description**: Analyzes a construction blueprint using OpenAI GPT-4o and returns structured technical report.

**Request Body**:
```json
{
  "fileUrl": "https://supabase-storage-url/blueprint.pdf",
  "fileName": "electrical-plan.pdf",
  "prompt": "Analyze electrical systems",
  "category": "Electrical"
}
```

**Response**:
```json
{
  "result": "## TAKEOFF\n\n[Detailed analysis with cost tables]\n\n## DISCREPANCIES\n\n..."
}
```

**Features**:
- Automatic quantity takeoffs
- Cost estimation using inventory
- Discrepancy detection
- RFI generation
- Technical summary
- Budget summary

### Equipment API

**Endpoints**:
- `GET /api/equipment` - List all equipment
- `POST /api/equipment` - Create equipment
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment

### Clients API

**Endpoints**:
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Projects API

**Endpoints**:
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## 🎨 Key Features Explained

### AI Blueprint Analysis

The blueprint analysis feature uses OpenAI's GPT-4o model with the Assistants API to:

1. **Upload & Process**: PDFs are uploaded to Supabase Storage and then to OpenAI
2. **Inventory Matching**: The AI receives your equipment inventory as JSON
3. **Structured Analysis**: Returns analysis in 5 sections:
   - **TAKEOFF**: Quantities and cost table using inventory prices
   - **DISCREPANCIES**: Design issues and conflicts
   - **RFIs**: Requests for Information
   - **TECHNICAL SUMMARY**: Engineering insights
   - **BUDGET SUMMARY**: Overall cost breakdown

4. **Smart Costing**: Only uses prices from your inventory - never invents costs
5. **Category Focus**: Analyzes based on selected category (Electrical, Plumbing, etc.)

### Equipment Inventory System

- Track all construction equipment and materials
- Categorize by type (Electrical, Plumbing, Tools, etc.)
- Monitor status (Available, In Use, Maintenance, Retired)
- Location tracking for multi-site operations
- Value and quantity management
- Integration with blueprint analysis for cost estimation

### Dashboard Analytics

- Real-time KPIs and metrics
- Equipment utilization charts
- Project status distribution
- Budget tracking
- Interactive visualizations

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com/)
3. Add environment variables
4. Deploy

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

### Deploy to Other Platforms

The app can be deployed to any platform that supports Next.js:

- **Netlify**: Use Next.js plugin
- **AWS Amplify**: Connect GitHub repo
- **Railway**: One-click deploy
- **DigitalOcean App Platform**: Docker or buildpack

### Environment Variables in Production

Make sure to set all environment variables in your deployment platform:
- Update `NEXT_PUBLIC_BASE_URL` to your production URL
- Use production Supabase credentials
- Secure all API keys

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint for code quality
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

For support, questions, or feedback:

- **Email**: support@supplai.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/supplai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/supplai/discussions)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [OpenAI](https://openai.com/) - AI Models
- [Radix UI](https://www.radix-ui.com/) - UI Components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vercel](https://vercel.com/) - Hosting Platform

---

**Built with ❤️ for the construction industry**

