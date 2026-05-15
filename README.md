# RoleIQ: AI-Powered Job Application Tracker 🚀

RoleIQ is a state-of-the-art job application tracking system that leverages the power of Large Language Models (LLMs) to help job seekers optimize their resumes, analyze job descriptions, and prepare for interviews. Built with a robust Django backend and a modern React frontend, RoleIQ acts as your personal AI career assistant.

---

## ✨ Key Features

### 📄 AI Resume Analysis
- **ATS Scoring**: Get an instant "ATS-friendliness" score for your resume.
- **Skill Detection**: Automatically extracts and categorizes technical and soft skills.
- **Strength & Weakness Mapping**: Identifies what makes your resume stand out and where it needs improvement.
- **Formatting Insights**: Detects common parsing issues that might prevent your resume from reaching recruiters.

### 🎯 Job Description Intelligence
- **Automated Parsing**: Extract required skills, nice-to-have qualifications, and seniority levels from any job description.
- **Match Scoring**: Quantify how well your resume matches a specific job role with detailed confidence levels.

### 📝 Smart Document Generation
- **Tailored CVs**: Generate context-aware professional summaries and experience sections tailored to a specific JD.
- **Resume Customization**: AI-driven suggestions for modifying your resume to better align with target roles.
- **Cover Letter Generation**: Create compelling, role-specific cover letters based on your background.

### 🧠 Interview Preparation
- **Contextual Questions**: Generates interview questions based on the intersection of your experience and the job requirements.
- **Role-Specific Prep**: Prepares you for the exact seniority level and company type you're applying to.

### 🔍 Semantic Search & RAG
- **Vector Embeddings**: Uses ChromaDB and BGE embeddings for advanced semantic search within your resume history.
- **Intelligent Recommendations**: Suggests the best-matching roles based on your analyzed skill set.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Icons & UI**: Lucide React, Radix UI, Framer Motion
- **Charts**: Recharts

### Backend
- **Framework**: Django 5.1 & Django REST Framework (DRF)
- **Database**: SQLite (Development) / PostgreSQL (Production ready)
- **Vector DB**: ChromaDB
- **Task Queue**: Celery with Redis
- **Auth**: JWT (SimpleJWT)

### AI Core
- **LLM**: Google Gemini 3.1 Flash-Lite
- **Orchestration**: LangChain
- **Embeddings**: BGE-Small-EN-v1.5 (Sentence Transformers)

---

## 🚀 Getting Started

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher
- **Redis**: Required for Celery task processing

### 1. Clone the Repository
```bash
git clone https://github.com/PavankalyanNaragani/RoleIQ---AI-Job-Tracker.git
cd RoleIQ---AI-Job-Tracker
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
SECRET_KEY=your-django-secret-key
GOOGLE_API_KEY=your-gemini-api-key
DEBUG=True
```

Run migrations and start the server:
```bash
python manage.py migrate
python manage.py runserver
```

**In a separate terminal, start the Celery worker:**
```bash
celery -A config worker --loglevel=info
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 🏗️ System Architecture
RoleIQ uses an asynchronous architecture to handle heavy AI processing:
1. **Frontend** triggers an analysis/generation request via DRF.
2. **Django** offloads the LLM task to **Celery**.
3. **Celery Worker** interacts with **Gemini API** and **ChromaDB**.
4. **Redis** acts as the message broker and result backend.
5. **Frontend** polls or receives updates when the AI task is complete.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---
*Made with ❤️ by [Pavankalyan Naragani](https://github.com/PavankalyanNaragani)*
