# CAIRA — AI-Powered Interview Readiness Platform

<div align="center">

![CAIRA Banner](https://img.shields.io/badge/CAIRA-Interview%20AI-6366f1?style=for-the-badge&logo=openai&logoColor=white)
![Next.js 14](https://img.shields.io/badge/Next.js-14.2.15-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-1.5_Flash-8e75ff?style=for-the-badge&logo=google&logoColor=white)

<p align="center">
  <strong>Master your high-stakes technical, behavioral, and leadership interviews through realistic, role-adaptive AI dialogue and real-time voice evaluation.</strong>
</p>

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Environment Setup](#-environment-variables) • [Project Architecture](#-project-architecture)

</div>

---

## 🌟 Overview

**CAIRA** is an intelligent, full-featured interview readiness platform that puts candidates in a realistic mock interview room. Powered by Google Gemini AI, CAIRA dynamically introduces herself in a natural female voice, reads role-specific technical and behavioral questions aloud, transcribes candidate voice responses in real time, and evaluates performance using the STAR framework to generate comprehensive readiness analytics.

---

## 🚀 Key Features

### 🎙️ AI Interviewer with Natural Female Voice
- **Automatic Self-Introduction**: CAIRA introduces herself upon entering the room, establishing the interview context and expectations for the target position.
- **Dynamic Question Narration**: Reads questions aloud using Web Speech API synthesis tuned for clear, natural female pacing and pitch.
- **Interactive Speech Visualizer**: Animated soundwaves and status indicators (`Introducing Interview...` ➔ `Reading Question` ➔ `Ready for Response`).
- **Full Audio Controls**: One-click Replay Intro & Question, Pause, and Mute/Unmute audio toggles with multi-voice fallback support.

### 🎤 Real-Time Voice Transcription
- **Continuous Speech-to-Text**: Candidate answers are captured and transcribed smoothly without mid-sentence interruptions.
- **Live Mic Audio Meter**: Real-time Web Audio API waveform visualizer confirms microphone input activity.
- **Interim Speech Preview**: Displays live candidate speech chunks (`Hearing you: "..."`) in real time before finalizing into the response editor.
- **Hybrid Input**: Candidates can speak naturally or seamlessly edit and refine their answers in the text box.

### 📹 Live Local Camera Preview
- **Candidate Webcam Interface**: In-browser video preview simulates the feel of live video interview calls.
- **Privacy-Preserving**: All camera and microphone streams are processed purely locally within the candidate's browser — zero video is sent to external servers.

### 🧠 Gemini-Powered Adaptive Rubric Evaluation
- **STAR Methodology Scoring**: Evaluates each response against Situation, Task, Action, and Result principles.
- **Turn-by-Turn Granular Feedback**: Immediate post-question scoring (0–10) detailing specific observed strengths and growth gaps.
- **Role-Adaptive Follow-Ups**: Dynamically crafts follow-up questions tailored to candidate answers, target role, and seniority level.

### 📊 Comprehensive Performance Report
- **Overall Readiness Index (0–100)**: Holistic candidate readiness metric.
- **Competency Breakdown**: Visual radar/bar metrics across System Architecture, Clean Code, Communication, and Problem Solving.
- **Hiring Recommendation**: Actionable summary report with downloadable review data and interview history tracking.

### ⚡ Seamless Offline Simulation Mode
- Designed to run out of the box with zero external configuration required.
- High-fidelity simulated evaluation mode is automatically active when live Gemini or Supabase API keys are not provided.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server Components & Route Handlers) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Vanilla Tailwind CSS](https://tailwindcss.com/) with Glassmorphic Dark Theme |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **AI Engine** | [Google Gemini 1.5 Flash](https://ai.google.dev/) via `@google/generative-ai` |
| **Voice & Audio** | Browser [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) & [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) |
| **Database & Auth** | [Supabase](https://supabase.com/) (`@supabase/ssr` & `@supabase/supabase-js`) |
| **Effects** | `canvas-confetti` for milestone celebrations |

---

## 📂 Project Architecture

```plaintext
CAIRA/
├── app/
│   ├── api/
│   │   ├── interviews/          # Create, list, fetch, answer evaluation & report endpoints
│   │   └── upload/resume/       # Resume upload & skill extraction handler
│   ├── dashboard/               # Readiness history, average metrics, past sessions
│   ├── interview/
│   │   ├── [id]/
│   │   │   ├── page.tsx         # Live Mock Interview Room
│   │   │   └── report/          # In-depth Performance & STAR Evaluation Report
│   │   └── new/                 # Role configuration, resume & JD upload setup
│   ├── globals.css              # Global styles & Tailwind imports
│   ├── layout.tsx               # Root layout with Navbar, Ambient Glow, and Footer
│   └── page.tsx                 # Modern Hero Landing Page with interactive preview
├── components/
│   ├── answer-input.tsx         # Answer editor with mic recorder & turn score feedback
│   ├── camera-preview.tsx       # Local webcam preview with mic audio analyser
│   ├── footer.tsx               # Multi-column platform footer with status & specs
│   ├── interviewer-voice.tsx    # Female voice TTS, speech visualizer & audio controls
│   ├── mic-recorder.tsx         # Web Speech API speech-to-text with continuous transcribing
│   ├── navbar.tsx               # Navigation bar with role quicklinks & user status
│   ├── question-card.tsx        # Question card with progress bar, type & skill badges
│   ├── report-summary.tsx       # Readiness score card, competency charts, strengths & gaps
│   └── score-badge.tsx          # Dynamic colored score pill
├── lib/
│   ├── ai/
│   │   └── gemini.ts            # Gemini 1.5 client, prompt rubrics, and offline simulation fallback
│   └── supabase/
│       ├── client.ts            # Browser Supabase client
│       ├── server.ts            # Server-side Supabase client
│       └── service.ts           # Data access layer & in-memory persistence store
└── types/
    └── interview.ts             # TypeScript interfaces for questions, evaluations & reports
```

---

## 💻 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18.17.0 or later
- npm v9 or later

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/stutitiwari23/CAIRA.git
   cd CAIRA
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables (Optional):**
   ```bash
   cp .env.example .env.local
   ```
   *(If left empty, CAIRA automatically runs in high-fidelity offline simulation mode).*

4. **Start the local development server:**
   ```bash
   npm run dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

To connect live Google Gemini and Supabase services, add your credentials in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini AI API
GEMINI_API_KEY=your-google-gemini-api-key
```

> **Note**: CAIRA is fully self-contained. When environment variables are omitted or invalid, the platform runs seamlessly with full interactive dialogue, voice recognition, and STAR evaluations.

---

## 🎯 Supported Interview Practice Tracks

- **Senior Full-Stack Engineer** (Next.js, TypeScript, Architecture, Databases)
- **Frontend & React Architect** (Component Design, Performance, State Management)
- **Backend & Distributed Systems** (Microservices, Concurrency, API Design)
- **Machine Learning & AI Engineer** (Model Lifecycle, LLM Orchestration, Pipelines)
- **Engineering Manager / Tech Lead** (Team Dynamics, Conflict Resolution, Delivery)
- **Technical Product Manager** (Roadmapping, Stakeholder Alignment, Metrics)

---

## 🛡️ Privacy & Local Execution

- **Microphone & Camera**: Audio input for speech-to-text and video streams run locally in the candidate's browser.
- **Audio Storage**: No candidate voice audio recordings are stored on server disks.
- **Session Privacy**: Mock sessions can be practiced with complete anonymity.

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ using Next.js, Google Gemini AI, and Web Speech API.</sub>
</div>
