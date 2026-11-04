# MeetMind AI 🧠
### Meeting Notes to Action Items Converter Using Generative AI

A complete, production-grade AI-powered web application that transforms unstructured meeting notes into structured summaries, decisions, action items, and analytics using **Generative AI** and **RAG (Retrieval-Augmented Generation)**.

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **pnpm** (or npm)
- **PostgreSQL 15+** (running locally)
- **Gemini API Key** (from Google AI Studio)

---

## ⚙️ Backend Setup

```bash
cd backend

# 1. Create virtual environment
python -m venv venv

# 2. Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file
copy .env.example .env
# Then edit .env with your credentials

# 5. Create PostgreSQL database
# Connect to PostgreSQL and run:
# CREATE DATABASE meetmind;

# 6. Start the backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000
API Docs: http://localhost:8000/docs

---

## 🎨 Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

The frontend will be available at: http://localhost:5173

---

## 🔐 Environment Variables (backend/.env)

```env
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/meetmind

# JWT Security (change this!)
SECRET_KEY=your-super-secret-jwt-key-at-least-32-chars

# Gemini AI (get from https://aistudio.google.com)
GEMINI_API_KEY=your-gemini-api-key-here

# ChromaDB (auto-created)
CHROMA_PERSIST_DIR=./chroma_db

# File uploads
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760
```

---

## 🧱 Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| React Router v6 | Navigation |
| Recharts | Analytics charts |
| Lucide React | Icons |
| Axios | API client |
| @dnd-kit | Kanban drag & drop |

### Backend
| Technology | Purpose |
|-----------|---------|
| FastAPI | Web framework |
| SQLAlchemy | ORM |
| PostgreSQL | Primary database |
| ChromaDB | Vector database (RAG) |
| Google Gemini | AI model |
| Sentence Transformers | Text embeddings |
| PyPDF | PDF extraction |
| python-docx | DOCX extraction |
| JWT + bcrypt | Authentication |

---

## 📁 Project Structure

```
genAI/
├── frontend/
│   ├── src/
│   │   ├── pages/           # All app pages
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # Auth & Theme contexts
│   │   ├── lib/             # API client
│   │   └── types/           # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # JWT authentication
│   │   ├── routers/         # API endpoints
│   │   └── services/        # Business logic
│   │       ├── ai_service.py    # Gemini AI
│   │       ├── rag_service.py   # ChromaDB RAG
│   │       ├── document_service.py
│   │       └── export_service.py
│   ├── main.py
│   └── requirements.txt
│
└── README.md
```

---

## 🔄 Application Workflow

1. **Register/Login** → Secure JWT authentication
2. **Create New Meeting** → Paste notes or upload PDF/DOCX/TXT
3. **AI Analysis** → Gemini AI + RAG context retrieval
4. **Review Results** → Summary, Decisions, Action Items
5. **Manage Tasks** → Kanban board or list view
6. **Knowledge Base** → Upload past meeting docs for RAG context
7. **Analytics** → Charts and insights on productivity

---

## 🤖 AI Features

- **Meeting Summarization**: Executive summaries + discussion points
- **Decision Extraction**: Approved/rejected/deferred decisions
- **Action Item Detection**: Tasks with assignee, deadline, priority
- **RAG Context**: Previous meetings inform current analysis
- **Confidence Scores**: AI confidence for each extracted item
- **Source References**: Links each task to supporting meeting text

---

## 📊 Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Marketing page |
| Login | `/login` | Authentication |
| Register | `/register` | New account |
| Dashboard | `/app/dashboard` | Overview + stats |
| New Meeting | `/app/new-meeting` | Analyze meeting notes |
| Meetings | `/app/meetings` | Meeting history |
| Meeting Detail | `/app/meetings/:id` | Full analysis results |
| Tasks | `/app/tasks` | Task management + Kanban |
| Knowledge Base | `/app/knowledge` | RAG document store |
| Analytics | `/app/analytics` | Charts + reports |

---

## 🎓 For University Demonstration

This application demonstrates:
- **Generative AI Integration** (Google Gemini)
- **RAG Architecture** (ChromaDB + Sentence Transformers)
- **Full-Stack Development** (React + FastAPI + PostgreSQL)
- **Professional UI/UX** design
- **Secure Authentication** (JWT + bcrypt)
- **Document Processing** (PDF, DOCX, TXT)
- **Data Visualization** (Recharts)
- **Task Management** (Kanban + CRUD)
