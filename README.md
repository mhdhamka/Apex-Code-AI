<div align="center">
  
# Apex Code AI

### AI-Powered Code Intelligence & Review Workspace

**A multi-model code intelligence platform that analyzes source code, diffs, and project files using AI — delivering actionable feedback across correctness, security, performance, maintainability, and architecture.**

[Live Demo](http://localhost:3000) · [Report Bug](https://github.com) · [Request Feature](https://github.com)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8%2B-3776AB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104%2B-009688.svg)
![Next.js](https://img.shields.io/badge/Next.js-14%2B-000000.svg)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2.svg)
![UI](https://img.shields.io/badge/UI-Dark%20Theme-0D1117.svg)

</div>

---

## Overview

**Apex Code AI** is an intelligent code analysis workspace designed to behave more like an experienced software engineer than a traditional static code checker.

Instead of simply reporting syntax errors or lint violations, Apex Code AI uses AI-powered reasoning to inspect code and provide contextual feedback across multiple dimensions:

* Code quality
* Bugs and potential runtime issues
* Security vulnerabilities
* Performance concerns
* Maintainability
* Architecture
* Best practices
* Refactoring opportunities

The platform supports multiple analysis workflows, from quick code snippets to GitHub diffs and batch file analysis.

> **Think of Apex Code AI as an AI-powered engineering review layer for your codebase.**

---

## Workspace

<div align="center">

![Apex Code AI Analysis & Inspector](./src/assets/images/preview.png)

*AI-driven code analysis and interactive developer workspace*

</div>

---

## Features

### AI Code Intelligence

Submit code to an AI model and receive structured engineering feedback rather than generic suggestions.

Analysis can identify:

* Potential bugs
* Code smells
* Security weaknesses
* Inefficient implementations
* Poor error handling
* Maintainability issues
* Architectural concerns
* Refactoring opportunities

---

### Multi-Model Analysis Engine

Apex Code AI is designed around a model abstraction layer, allowing the analysis engine to support different AI models without rebuilding the entire application.

Current AI integration:

* **Google Gemini**
* Configurable model selection
* Centralized API communication
* Token usage tracking
* Model response monitoring

---

### Multiple Analysis Modes

#### Manual Snippet

Paste code directly into the workspace and receive an immediate AI review.

```text
Paste Code → Select Language → Analyze → Review Results
```

#### GitHub / Diff Analysis

Analyze code changes rather than reviewing an entire codebase.

Useful for:

* Pull requests
* Commit diffs
* Patch files
* Code changes

```text
Git Diff → AI Analysis → Findings → Recommendations
```

#### Batch File Analysis

Submit multiple source files for analysis and evaluate code quality across a larger project context.

---

### Code Health & Findings

Analysis results can be organized around engineering concerns such as:

| Category           | Examples                                          |
| ------------------ | ------------------------------------------------- |
|    Bugs            | Logic errors, edge cases, runtime failures        |
|    Security        | Injection, unsafe input handling, exposed secrets |
|    Performance     | Expensive operations, inefficient algorithms      |
|    Quality         | Code smells, duplication, complexity              |
|    Architecture    | Structural and design concerns                    |
|    Maintainability | Refactoring and long-term maintenance             |
|    Recommendations | Engineering improvements                          |

---

### Live Engine Telemetry

The workspace provides visibility into the AI analysis process, including:

* API request status
* Model information
* Token usage
* Processing state
* Analysis response
* Asynchronous request execution

Backend communication is handled through asynchronous HTTP requests using `httpx`.

---

### Cyberpunk Developer Workspace

Apex Code AI uses a high-contrast dark interface designed around a modern security / developer-tool aesthetic.

Built with:

* Next.js
* Tailwind CSS
* Lucide Icons
* Responsive layouts
* Interactive analysis panels
* Developer-focused visual hierarchy

---

## Architecture

Apex Code AI follows a decoupled frontend/backend architecture:

```text
┌───────────────────────────────────────────┐
│              Next.js Frontend             │
│                                           │
│  Analysis Workspace                       │
│  Code Editor                              │
│  Findings / Results                       │
│  Engine Telemetry                         │
└────────────────────┬──────────────────────┘
                     │
                     │ HTTP / JSON
                     ▼
┌───────────────────────────────────────────┐
│              FastAPI Backend              │
│                                           │
│  API Routes                               │
│  Request Validation                       │
│  AI Service Layer                         │
│  Analysis Processing                      │
└────────────────────┬──────────────────────┘
                     │
                     │ Gemini API
                     ▼
┌───────────────────────────────────────────┐
│             Google Gemini AI              │
│                                           │
│       AI-Powered Code Analysis            │
└───────────────────────────────────────────┘
```

This separation allows the frontend and AI backend to evolve independently while keeping model-specific logic isolated from the UI.

---

## Tech Stack

### Frontend

* **Next.js 14+**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **Lucide React**

### Backend

* **Python 3.8+**
* **FastAPI**
* **Uvicorn**
* **Pydantic**
* **HTTPX**
* **python-dotenv**

### AI

* **Google Gemini API**

---

## Project Structure

```text
codeReview/
│
├── app/
│   └── main.py                 # FastAPI application
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Main analysis workspace
│   │   └── layout.tsx
│   │
│   ├── components/             # UI components
│   ├── lib/                    # Frontend utilities
│   ├── public/                 # Static assets
│   └── package.json
│
├── src/
│   └── assets/
│       └── images/
│           └── preview.png
│
├── .env                        # Local environment variables
├── .gitignore
├── requirements.txt            # Python dependencies
└── README.md
```

> The exact directory structure may vary as the project evolves.

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

* **Python 3.8+**
* **Node.js 18+**
* **npm**
* **Google Gemini API key**

Get a Gemini API key from:

[Google AI Studio](https://aistudio.google.com/apikey)

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/apex-code-ai.git
cd apex-code-ai
```

---

## 2. Backend Setup

Create a Python virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

---

## 3. Configure Environment Variables

Create a `.env` file in the backend/project root:

```env
GEMINI_API_KEY=your_api_key_here
```

Do **not** commit your `.env` file to Git.

Make sure `.gitignore` contains:

```gitignore
.env
venv/
__pycache__/
node_modules/
.next/
```

---

## 4. Start the FastAPI Backend

From the project root:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend:

```text
http://localhost:8000
```

FastAPI Swagger documentation:

```text
http://localhost:8000/docs
```

ReDoc:

```text
http://localhost:8000/redoc
```

---

## 5. Start the Next.js Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Open the application in your browser:

**http://localhost:3000**

---

# Analysis Workflow

```text
                ┌───────────────┐
                │  Source Code  │
                └───────┬───────┘
                        │
                        ▼
              ┌───────────────────┐
              │ Select Input Mode │
              └─────────┬─────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
      Snippet        Git Diff      Batch Files
          │             │             │
          └─────────────┼─────────────┘
                        ▼
              ┌───────────────────┐
              │ FastAPI Backend   │
              └─────────┬─────────┘
                        ▼
              ┌───────────────────┐
              │  AI Model Engine  │
              └─────────┬─────────┘
                        ▼
              ┌───────────────────┐
              │ Code Intelligence │
              │     Analysis      │
              └─────────┬─────────┘
                        ▼
              ┌───────────────────┐
              │ Findings & Review │
              └───────────────────┘
```

---

## Security

Apex Code AI is intended for development and experimentation.

When deploying the platform publicly:

* Never expose your Gemini API key to the frontend.
* Keep secrets in environment variables.
* Validate uploaded files before processing them.
* Apply request size limits.
* Add authentication and authorization.
* Implement API rate limiting.
* Sanitize user-controlled input.
* Avoid logging sensitive source code.
* Use HTTPS in production.
* Restrict CORS to trusted origins.

---

## Development

Run the backend with hot reload:

```bash
uvicorn app.main:app --reload
```

Run the frontend:

```bash
npm run dev
```

For production builds:

```bash
npm run build
npm start
```

---

## 🗺️ Roadmap

* [x] AI-powered code review
* [x] FastAPI backend
* [x] Next.js frontend
* [x] Gemini integration
* [x] Manual code analysis
* [x] Code diff analysis
* [x] Batch file analysis
* [x] Token usage telemetry
* [ ] GitHub repository integration
* [ ] Pull Request automation
* [ ] Multi-model comparison
* [ ] Persistent analysis history
* [ ] Project-level code intelligence
* [ ] Security-focused analysis
* [ ] Automated refactoring suggestions
* [ ] Code quality scoring
* [ ] CI/CD integration
* [ ] Team workspaces
* [ ] Authentication & RBAC

---

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/your-feature
```

3. Commit your changes.

```bash
git commit -m "feat: add your feature"
```

4. Push the branch.

```bash
git push origin feature/your-feature
```

5. Open a Pull Request.

---

<div align="center">

### Apex Code AI

**Understand your code. Find the problems. Ship with confidence.**

Built with **FastAPI · Next.js · Google Gemini**

**Crafted by [mhdhamka](https://github.com/mhdhamka)**

</div>
