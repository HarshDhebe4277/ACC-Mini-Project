# **Master Engineering Plan: College Event Management System (Cloud Native CI/CD)**

## **1\. System Architecture & Tech Stack Matrix**

                     \+------------------------------------------+  
                      |         Client Layer (PWA / Web)         |  
                      |  Next.js 14+ (App Router) \+ shadcn/ui    |  
                      |  Tailwind CSS \+ Lucide Icons \+ PWA SW    |  
                      \+--------------------+---------------------+  
                                           |  
                                  HTTPS / REST / WS  
                                           |  
                                           v  
                      \+------------------------------------------+  
                      |          Ingress / API Gateway           |  
                      |           GKE NGINX / Cloud Ingress      |  
                      \+--------------------+---------------------+  
                                           |  
                 \+-------------------------+-------------------------+  
                 |                                                   |  
                 v                                                   v  
\+---------------------------------+               \+---------------------------------+  
|     FastAPI Backend Pods        |               |      Next.js Frontend Pods      |  
|  \- Auth Middleware (Supabase)   |               |  \- SSR / Server Components      |  
|  \- Role-Based Access Control    |               |  \- Client Hydration & PWA Cache |  
|  \- Business Domain APIs         |               |  \- QR Code Scanner Engine       |  
|  \- Report & PDF Generators      |               \+---------------------------------+  
\+----------------+----------------+  
                 |  
      \+----------+----------+  
      |                     |  
      v                     v  
\+------------+       \+-------------+  
|  Supabase  |       |  LangChain  |  
| PostgreSQL |       |   Mistral   |  
| (Auth/RLS) |       |  (AI Engine)|  
\+------------+       \+-------------+

| Layer | Component | Specification |
| :---- | :---- | :---- |
| **Frontend** | Framework & UI | Next.js 14+ (App Router, TypeScript), Tailwind CSS, shadcn/ui, Lucide Icons |
| **Mobile/Offline** | Progressive Web App | next-pwa / @ducanh2912/next-pwa, Service Workers, Web App Manifest |
| **Backend** | API Engine | FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy 2.0 / Supabase-py, Uvicorn |
| **AI Integration** | Agent Engine | langchain-mistralai, Mistral-Large / Codestral for event generation & analytics |
| **Data & Auth** | Database & Identity | Supabase Managed PostgreSQL, Row Level Security (RLS), Google OAuth 2.0 |
| **Container** | Packaging | Multi-stage Dockerfiles (Alpine/Slim), non-root execution |
| **Orchestration** | Cluster Engine | Google Kubernetes Engine (GKE), Namespaces, Secrets, Ingress, HPA |
| **CI/CD** | Pipeline Automation | GitHub Actions, Google Cloud Workload Identity / Service Account Keys |
| **Registry** | Image Storage | GCP Artifact Registry |

## **2\. Coding Agent Operating Protocol & Session Mandate**

The coding agent working on this repository **must** operate under the following rules:

### **2.1 The Two-File Session Initialization Rule**

Every work session must begin by executing this sequence before any code edits:

1. Open and parse docs/ARCHITECTURE.md to confirm system boundaries.  
2.   
3. Open and inspect progress\_tracker.md to identify:  
4. 

   * Current Phase and active Sprint Task.  
   *   
   * Any blockers marked in the prior session.  
   *   
   * Pending unit or integration tests.  
   *   
5. No task may be started without first updating its status in progress\_tracker.md from \[ \] to \[IN PROGRESS\].  
6. 

### **2.2 Granular Progress Tracker Standard (**progress\_tracker.md**)**

The file progress\_tracker.md must be maintained at the repository root with this exact format:

Markdown  
\# Micro-Project Progress Tracker

\#\# Last Updated: \[YYYY-MM-DD HH:MM UTC\]  
\#\# Current Phase: Phase X \- \[Phase Name\]  
\#\# Active Task: \[Task ID and Description\]

\---

\#\#\# Phase Breakdown

\- \[x\] Phase 1: Environment Setup & Project Scaffolding  
  \- \[x\] Task 1.1: Virtualenv and Python dependencies setup  
  \- \[x\] Task 1.2: Next.js \+ Tailwind \+ shadcn/ui initial app setup  
  \- \[x\] Task 1.3: Supabase project init, database migrations, and RLS policies  
\- \[ \] Phase 2: FastAPI Core & RBAC Engine  
  \- \[IN PROGRESS\] Task 2.1: Supabase JWT verification dependency  
  \- \[ \] Task 2.2: Event management CRUD endpoints  
  \- \[ \] Task 2.3: QR code token creation & verification endpoints  
...

\#\#\# Verification Log  
| Timestamp | Task ID | Test Command Executed | Result (Pass/Fail) | Notes |  
| :--- | :--- | :--- | :--- | :--- |  
| 2026-10-12 | Task 1.1 | \`pytest tests/test\_env.py\` | PASS | Environment vars verified |

\#\#\# Known Blockers & Technical Debt  
\- Blocker: None

### **2.3 Hygiene & Isolation Mandates**

* **Python**: Always operate inside an isolated virtual environment (backend/.venv). Re-run pip freeze \> requirements.txt whenever new packages are added.  
*   
* **Node**: Use pnpm or npm with locked dependencies (package-lock.json).  
*   
* **Secrets**: Never commit real keys. Maintain comprehensive .env.example templates in both backend/ and frontend/.  
*   
* **Testing**: Every endpoint and core utility must have an accompanying test file (tests/test\_\*.py for backend, \_\_tests\_\_ for frontend).  
* 

## **3\. Repository File Structure**

college-event-system/  
├── .github/  
│   └── workflows/  
│       ├── backend-ci-cd.yaml  
│       └── frontend-ci-cd.yaml  
├── backend/  
│   ├── app/  
│   │   ├── api/  
│   │   │   ├── v1/  
│   │   │   │   ├── endpoints/  
│   │   │   │   │   ├── auth.py  
│   │   │   │   │   ├── events.py  
│   │   │   │   │   ├── registrations.py  
│   │   │   │   │   ├── attendance.py  
│   │   │   │   │   ├── feedback.py  
│   │   │   │   │   ├── certificates.py  
│   │   │   │   │   ├── ai\_assistant.py  
│   │   │   │   │   ├── admin.py  
│   │   │   │   │   └── reports.py  
│   │   │   │   └── router.py  
│   │   ├── core/  
│   │   │   ├── config.py  
│   │   │   ├── security.py  
│   │   │   └── dependencies.py  
│   │   ├── models/  
│   │   │   └── schemas.py  
│   │   ├── services/  
│   │   │   ├── supabase\_service.py  
│   │   │   ├── mistral\_service.py  
│   │   │   ├── qr\_service.py  
│   │   │   └── pdf\_service.py  
│   │   └── main.py  
│   ├── tests/  
│   │   ├── conftest.py  
│   │   ├── test\_auth.py  
│   │   ├── test\_events.py  
│   │   └── test\_ai.py  
│   ├── .env.example  
│   ├── .gitignore  
│   ├── Dockerfile  
│   ├── requirements.txt  
│   └── requirements-dev.txt  
├── frontend/  
│   ├── public/  
│   │   ├── icons/  
│   │   │   ├── icon-192x192.png  
│   │   │   └── icon-512x512.png  
│   │   └── manifest.json  
│   ├── src/  
│   │   ├── app/  
│   │   │   ├── (auth)/  
│   │   │   │   ├── login/page.tsx  
│   │   │   │   └── auth/callback/route.ts  
│   │   │   ├── (dashboard)/  
│   │   │   │   ├── student/  
│   │   │   │   │   ├── dashboard/page.tsx  
│   │   │   │   │   ├── events/page.tsx  
│   │   │   │   │   ├── events/\[id\]/page.tsx  
│   │   │   │   │   └── my-passes/page.tsx  
│   │   │   │   ├── organizer/  
│   │   │   │   │   ├── dashboard/page.tsx  
│   │   │   │   │   ├── create-event/page.tsx  
│   │   │   │   │   ├── events/\[id\]/page.tsx  
│   │   │   │   │   ├── scanner/page.tsx  
│   │   │   │   │   └── analytics/page.tsx  
│   │   │   │   ├── faculty/  
│   │   │   │   │   ├── dashboard/page.tsx  
│   │   │   │   │   ├── approvals/page.tsx  
│   │   │   │   │   └── reports/page.tsx  
│   │   │   │   └── admin/  
│   │   │   │       ├── dashboard/page.tsx  
│   │   │   │       ├── users/page.tsx  
│   │   │   │       ├── venues/page.tsx  
│   │   │   │       ├── approvals/page.tsx  
│   │   │   │       └── audit-logs/page.tsx  
│   │   │   ├── layout.tsx  
│   │   │   └── page.tsx  
│   │   ├── components/  
│   │   │   ├── ui/               \# shadcn components  
│   │   │   ├── ai-event-draft-modal.tsx  
│   │   │   ├── qr-scanner.tsx  
│   │   │   ├── ticket-pass.tsx  
│   │   │   └── navbar.tsx  
│   │   ├── lib/  
│   │   │   ├── supabase/  
│   │   │   │   ├── client.ts  
│   │   │   │   └── server.ts  
│   │   │   ├── api-client.ts  
│   │   │   └── utils.ts  
│   │   └── types/  
│   │       └── index.ts  
│   ├── .env.example  
│   ├── .gitignore  
│   ├── Dockerfile  
│   ├── next.config.mjs  
│   ├── package.json  
│   └── tailwind.config.ts  
├── k8s/  
│   ├── base/  
│   │   ├── namespace.yaml  
│   │   ├── configmap.yaml  
│   │   ├── secrets.yaml.example  
│   │   ├── backend-deployment.yaml  
│   │   ├── backend-service.yaml  
│   │   ├── frontend-deployment.yaml  
│   │   ├── frontend-service.yaml  
│   │   └── ingress.yaml  
│   └── overlays/  
│       └── production/  
│           └── kustomization.yaml  
├── docs/  
│   ├── ARCHITECTURE.md  
│   ├── SUPABASE\_SETUP.md  
│   ├── GCP\_GKE\_SETUP.md  
│   └── CI\_CD\_SETUP.md  
├── progress\_tracker.md  
└── README.md

## **4\. Role-Based Access Control (RBAC) & Database Schema**

The database design directly satisfies the four user journeys defined in the system specification: **Student**, **Organizer**, **Faculty**, and **Administrator**.

### **4.1 Enums and Custom Types**

SQL  
CREATE TYPE user\_role AS ENUM ('STUDENT', 'ORGANIZER', 'FACULTY', 'ADMIN');  
CREATE TYPE event\_status AS ENUM ('DRAFT', 'SUBMITTED', 'FACULTY\_RECOMMENDED', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');  
CREATE TYPE registration\_status AS ENUM ('CONFIRMED', 'WAITLISTED', 'CANCELLED', 'ATTENDED');  
CREATE TYPE certificate\_status AS ENUM ('PENDING', 'ISSUED', 'REVOKED');

### **4.2 Core Tables DDL**

SQL  
\-- 1\. Profiles Table (Linked to supabase auth.users)  
CREATE TABLE public.profiles (  
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  
    email TEXT NOT NULL UNIQUE,  
    full\_name TEXT NOT NULL,  
    department TEXT,  
    role user\_role DEFAULT 'STUDENT' NOT NULL,  
    avatar\_url TEXT,  
    is\_active BOOLEAN DEFAULT TRUE NOT NULL,  
    created\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  
    updated\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL  
);

\-- Trigger to create profile automatically on Supabase OAuth sign-up  
CREATE OR REPLACE FUNCTION public.handle\_new\_user()  
RETURNS TRIGGER AS \$\$  
BEGIN  
    INSERT INTO public.profiles (id, email, full\_name, avatar\_url, role)  
    VALUES (  
        new.id,  
        new.email,  
        COALESCE(new.raw\_user\_meta\_data-\>\>'full\_name', new.raw\_user\_meta\_data-\>\>'name', 'User'),  
        new.raw\_user\_meta\_data-\>\>'avatar\_url',  
        'STUDENT'  
    );  
    RETURN NEW;  
END;  
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on\_auth\_user\_created  
    AFTER INSERT ON auth.users  
    FOR EACH ROW EXECUTE FUNCTION public.handle\_new\_user();

\-- 2\. Venues & Categories  
CREATE TABLE public.venues (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    name TEXT NOT NULL UNIQUE,  
    capacity INT NOT NULL CHECK (capacity \> 0),  
    location TEXT NOT NULL,  
    facilities TEXT\[\] DEFAULT ARRAY\[\]::TEXT\[\],  
    is\_available BOOLEAN DEFAULT TRUE NOT NULL  
);

CREATE TABLE public.categories (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    name TEXT NOT NULL UNIQUE,  
    description TEXT  
);

\-- 3\. Events Table  
CREATE TABLE public.events (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    title TEXT NOT NULL,  
    description TEXT NOT NULL,  
    category\_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,  
    venue\_id UUID REFERENCES public.venues(id) ON DELETE RESTRICT,  
    organizer\_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,  
    department TEXT NOT NULL,  
    start\_time TIMESTAMPTZ NOT NULL,  
    end\_time TIMESTAMPTZ NOT NULL,  
    registration\_deadline TIMESTAMPTZ NOT NULL,  
    max\_capacity INT NOT NULL CHECK (max\_capacity \> 0),  
    current\_capacity INT DEFAULT 0 NOT NULL,  
    status event\_status DEFAULT 'DRAFT' NOT NULL,  
    rejection\_reason TEXT,  
    ai\_generated\_tags TEXT\[\] DEFAULT ARRAY\[\]::TEXT\[\],  
    ai\_summary TEXT,  
    banner\_url TEXT,  
    created\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  
    updated\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL  
);

\-- 4\. Registrations Table  
CREATE TABLE public.registrations (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    event\_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,  
    user\_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,  
    status registration\_status DEFAULT 'CONFIRMED' NOT NULL,  
    ticket\_qr\_hash TEXT NOT NULL UNIQUE,  
    created\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  
    UNIQUE(event\_id, user\_id)  
);

\-- 5\. Attendance Records  
CREATE TABLE public.attendance (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    registration\_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL UNIQUE,  
    marked\_by UUID REFERENCES public.profiles(id) NOT NULL,  
    marked\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  
    attendance\_method TEXT CHECK (attendance\_method IN ('QR\_SCAN', 'MANUAL')) NOT NULL  
);

\-- 6\. Feedback Table  
CREATE TABLE public.feedbacks (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    event\_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,  
    user\_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,  
    rating INT CHECK (rating BETWEEN 1 AND 5\) NOT NULL,  
    comments TEXT,  
    sentiment\_tag TEXT,  
    created\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  
    UNIQUE(event\_id, user\_id)  
);

\-- 7\. Certificates Table  
CREATE TABLE public.certificates (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    registration\_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL UNIQUE,  
    certificate\_url TEXT NOT NULL,  
    issued\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  
    status certificate\_status DEFAULT 'ISSUED' NOT NULL  
);

\-- 8\. Audit Logs Table  
CREATE TABLE public.audit\_logs (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    actor\_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  
    action TEXT NOT NULL,  
    target\_resource TEXT NOT NULL,  
    resource\_id TEXT,  
    details JSONB,  
    created\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL  
);

### **4.3 Supabase Row Level Security (RLS) Matrix**

SQL  
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.audit\_logs ENABLE ROW LEVEL SECURITY;

\-- Helper function to extract user role securely  
CREATE OR REPLACE FUNCTION public.get\_current\_role()  
RETURNS user\_role AS \$\$  
    SELECT role FROM public.profiles WHERE id \= auth.uid();  
\$\$ LANGUAGE sql STABLE SECURITY DEFINER;

\-- Profiles: Anyone authenticated can read basic profiles; only self or admin can update  
CREATE POLICY "Profiles readable by auth users" ON public.profiles  
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles  
    FOR UPDATE TO authenticated USING (id \= auth.uid());

CREATE POLICY "Admins full update on profiles" ON public.profiles  
    FOR ALL TO authenticated USING (public.get\_current\_role() \= 'ADMIN');

\-- Events:  
\-- Publicly visible if APPROVED  
CREATE POLICY "Approved events are viewable by all" ON public.events  
    FOR SELECT TO authenticated USING (status \= 'APPROVED' OR organizer\_id \= auth.uid() OR public.get\_current\_role() IN ('FACULTY', 'ADMIN'));

\-- Organizers can insert drafts/events  
CREATE POLICY "Organizers can create events" ON public.events  
    FOR INSERT TO authenticated WITH CHECK (public.get\_current\_role() IN ('ORGANIZER', 'ADMIN'));

\-- Organizers can update own events if in DRAFT or REJECTED  
CREATE POLICY "Organizers edit own drafts" ON public.events  
    FOR UPDATE TO authenticated USING (  
        (organizer\_id \= auth.uid() AND status IN ('DRAFT', 'REJECTED'))  
        OR public.get\_current\_role() \= 'ADMIN'  
        OR (public.get\_current\_role() \= 'FACULTY' AND department \= (SELECT department FROM public.profiles WHERE id \= auth.uid()))  
    );

\-- Registrations:  
\-- Students can see their own registrations; Organizers see registrations for their events  
CREATE POLICY "Users see own registrations" ON public.registrations  
    FOR SELECT TO authenticated USING (  
        user\_id \= auth.uid()   
        OR EXISTS (SELECT 1 FROM public.events WHERE events.id \= registrations.event\_id AND events.organizer\_id \= auth.uid())  
        OR public.get\_current\_role() IN ('FACULTY', 'ADMIN')  
    );

CREATE POLICY "Students can register for approved events" ON public.registrations  
    FOR INSERT TO authenticated WITH CHECK (  
        user\_id \= auth.uid() AND  
        EXISTS (SELECT 1 FROM public.events WHERE id \= event\_id AND status \= 'APPROVED')  
    );

## **5\. Phased Implementation Roadmap**

### **Phase 1: Environment Setup, Database Core & Repository Infrastructure**

#### **Goal**

Establish isolated environments, initialize Next.js and FastAPI, deploy the Supabase database schema with RLS, and seed test accounts.

#### **Agent Directives & Tasks**

1. **Initialize Git & Progress Tracker**:  
2. 

   * Create repository structure matching Section 3\.  
   *   
   * Generate progress\_tracker.md with full checklist.  
   *   
3. **Backend Setup**:  
4. 

   * Initialize Python virtual environment:  
   * 

   * Bash

cd backend  
python3 \-m venv .venv  
source .venv/bin/activate  
pip install \--upgrade pip

*   
  *   
  * Create requirements.txt:  
  * 

  * Plaintext

fastapi==0.111.0  
uvicorn\[standard\]==0.30.1  
pydantic==2.7.4  
pydantic-settings==2.3.4  
supabase==2.5.1  
python-jose\[cryptography\]==3.3.0  
passlib==1.7.4  
langchain-mistralai==0.1.8  
langchain-core==0.2.10  
reportlab==4.2.0  
qrcode\[pil\]==7.4.2  
httpx==0.27.0  
pytest==8.2.2  
pytest-asyncio==0.23.7  
python-multipart==0.0.9

*   
  *   
  * Create .env.example with Supabase, Mistral, and App keys.  
  *   
5. **Frontend Setup**:  
6. 

   * Initialize Next.js 14 with App Router, TypeScript, Tailwind CSS:  
   * 

   * Bash

cd ..  
npx create-next-app@latest frontend \--typescript \--tailwind \--eslint \--app \--src-dir \--import-alias "@/\*" \--use-pnpm  
cd frontend  
npx shadcn@latest init  
pnpm add @supabase/supabase-js @supabase/ssr lucide-react clsx tailwind-merge html5-qrcode @ducanh2912/next-pwa canvas-confetti jspdf

*   
  *   
  * Install shadcn components: button, card, dialog, dropdown-menu, input, form, select, tabs, table, badge, toast, skeleton.  
  *   
7. **Supabase & Google OAuth Configuration**:  
8. 

   * Execute all DDL from Section 4 in the Supabase SQL editor.  
   *   
   * Configure Google OAuth Client ID and Secret in Supabase Auth Settings.  
   * 

#### **In-and-Out Agent Prompt**

Plaintext  
PROMPT FOR AGENT \- PHASE 1:  
"Agent, initialize the College Event Management System codebase:  
1\. Verify you have read docs/ARCHITECTURE.md and updated progress\_tracker.md with Task 1 \[IN PROGRESS\].  
2\. Set up the backend virtual environment in backend/.venv, install the pinned requirements.txt, and build backend/.env.example containing SUPABASE\_URL, SUPABASE\_SERVICE\_ROLE\_KEY, SUPABASE\_JWT\_SECRET, MISTRAL\_API\_KEY, and ALLOWED\_ORIGINS.  
3\. Initialize the frontend with Next.js 14 App Router, install shadcn/ui, configure Tailwind, and set up next-pwa for offline PWA capabilities in next.config.mjs.  
4\. Run the SQL schema from Section 4 of the architectural plan on Supabase.  
5\. Create a verification test backend/tests/test\_env.py that checks if all environment configurations load cleanly without null pointers.  
6\. Commit changes with message: 'feat(infra): scaffolding, database ddl, and base configurations'."

### **Phase 2: FastAPI Backend Engine & RBAC Implementation**

#### **Goal**

Develop production-grade FastAPI endpoints with Supabase JWT validation, role checking, event lifecycle transitions, ticket QR hashing, and attendance scanning.

#### **Agent Directives & Tasks**

1. **Security & Dependencies (**backend/app/core/dependencies.py**)**:  
2. 

   * Decode Supabase JWT via python-jose using SUPABASE\_JWT\_SECRET.  
   *   
   * Implement role enforcement dependency factory:  
   * 

   * Python

def require\_role(allowed\_roles: list\[str\]):  
    async def role\_checker(current\_user: User \= Depends(get\_current\_user)):  
        if current\_user.role not in allowed\_roles:  
            raise HTTPException(status\_code=403, detail="Insufficient role permissions")  
        return current\_user  
    return role\_checker

*   
  *   
3. **Event Endpoints (**backend/app/api/v1/endpoints/events.py**)**:  
4. 

   * POST /events (Organizer/Admin): Create draft.  
   *   
   * PUT /events/{id}/submit (Organizer): Transition from DRAFT to SUBMITTED.  
   *   
   * PUT /events/{id}/recommend (Faculty): Faculty review; transition to FACULTY\_RECOMMENDED.  
   *   
   * PUT /events/{id}/approve (Admin): Approve event and publish to schedule.  
   *   
   * PUT /events/{id}/reject (Faculty/Admin): Reject with mandatory reason comment.  
   *   
   * GET /events: Filterable by category, department, status, date range.  
   *   
5. **Registration & Ticket Generation (**backend/app/api/v1/endpoints/registrations.py**)**:  
6. 

   * POST /events/{id}/register (Student):  
   * 

     * Check capacity atomically. If full, assign WAITLISTED.  
     *   
     * Generate cryptographic HMAC SHA-256 string for ticket\_qr\_hash.  
     *   
   * GET /students/me/passes: Returns user's confirmed event passes with hashed payload.  
   *   
7. **Attendance Validation (**backend/app/api/v1/endpoints/attendance.py**)**:  
8. 

   * POST /attendance/scan (Organizer/Admin):  
   * 

     * Accept scanned ticket\_qr\_hash.  
     *   
     * Verify event ownership by caller.  
     *   
     * Check if ticket already redeemed; return error if already checked in.  
     *   
     * Record attendance entry (QR\_SCAN).  
     *   
9. **Certificates & Reports (**backend/app/api/v1/endpoints/certificates.py**,** reports.py**)**:  
10. 

    * Generate dynamic PDF certificates using reportlab upon student request if attendance is confirmed.  
    *   
    * Generate department attendance and registration reports in CSV/PDF for Faculty and Admin.  
    * 

#### **In-and-Out Agent Prompt**

Plaintext  
PROMPT FOR AGENT \- PHASE 2:  
"Agent, implement the backend business logic and RBAC engine:  
1\. Update progress\_tracker.md marking Phase 2 as \[IN PROGRESS\].  
2\. Build backend/app/core/dependencies.py with Supabase JWT bearer token verification and require\_role(\['STUDENT', 'ORGANIZER', 'FACULTY', 'ADMIN'\]).  
3\. Implement Pydantic schemas in backend/app/models/schemas.py for EventCreate, EventUpdate, EventResponse, RegistrationResponse, AttendanceScanRequest, and FeedbackCreate.  
4\. Implement the full event workflow in backend/app/api/v1/endpoints/events.py (Draft \-\> Submit \-\> Recommend \-\> Approve/Reject).  
5\. Implement backend/app/services/qr\_service.py to sign registration payloads with an HMAC secret and verify them during attendance scanning.  
6\. Write unit tests in backend/tests/test\_events.py testing the complete approval lifecycle and RBAC restrictions. Ensure pytest passes with 100% green exit code."

### **Phase 3: AI Co-Pilot Integration (**langchain\_mistral**)**

#### **Goal**

Implement AI assistant capabilities for organizers and administrators using Mistral AI models to auto-draft event descriptions, generate schedules, formulate tags, and summarize post-event feedback.

#### **Agent Directives & Tasks**

1. **Mistral Engine Setup (**backend/app/services/mistral\_service.py**)**:  
2. 

   * Initialize ChatMistralAI with mistral-large-latest or codestral-latest.  
   *   
   * Use structured outputs via Pydantic or LangChain JSON output parsers.  
   *   
3. **AI Capabilities**:  
4. 

   * **Draft Assistant**: Accepts rough organizer inputs (e.g., *"3-day Hackathon for 2nd year CS students on Cloud & AI with 50k prize pool"*) and returns:  
   * 

     * Polished Title  
     *   
     * Structured Description (About, Eligibility, Schedule, Prizes)  
     *   
     * Recommended Tags (e.g., \['Cloud', 'Hackathon', 'GCP', 'Coding'\])  
     *   
     * Suggested Capacity & Venue requirements  
     *   
   * **Post-Event Sentiment & Insights**:  
   * 

     * Takes list of feedback comments and ratings for completed events.  
     *   
     * Produces executive summaries, key improvement areas, and sentiment tags (Positive, Neutral, Critical).  
     *   
5. **Endpoint (**backend/app/api/v1/endpoints/ai\_assistant.py**)**:  
6. 

   * POST /ai/draft-event: Secured to ORGANIZER and ADMIN.  
   *   
   * POST /ai/summarize-feedback/{event\_id}: Secured to ORGANIZER, FACULTY, and ADMIN.  
   * 

#### **LangChain Mistral Implementation Pattern**

Python  
from langchain\_mistralai import ChatMistralAI  
from langchain\_core.prompts import ChatPromptTemplate  
from pydantic import BaseModel, Field  
from app.core.config import settings

class EventDraftOutput(BaseModel):  
    title: str \= Field(description="Catchy and formal title for the event")  
    description: str \= Field(description="Comprehensive event overview formatted with markdown")  
    tags: list\[str\] \= Field(description="5 relevant categorization tags")  
    prerequisites: list\[str\] \= Field(description="Eligibility criteria and required items")  
    suggested\_agenda: list\[str\] \= Field(description="Step-by-step timeline of the event")

class MistralAIService:  
    def \_\_init\_\_(self):  
        self.llm \= ChatMistralAI(  
            mistral\_api\_key=settings.MISTRAL\_API\_KEY,  
            model="mistral-large-latest",  
            temperature=0.3  
        )

    async def generate\_event\_draft(self, rough\_prompt: str, department: str) \-\> EventDraftOutput:  
        structured\_llm \= self.llm.with\_structured\_output(EventDraftOutput)  
        prompt \= ChatPromptTemplate.from\_messages(\[  
            ("system", "You are an expert collegiate event management director. "  
                       "Convert rough ideas into professional, high-impact college event drafts."),  
            ("human", "Department: {department}\\nRaw Event Idea: {rough\_prompt}")  
        \])  
        chain \= prompt | structured\_llm  
        return await chain.ainvoke({"department": department, "rough\_prompt": rough\_prompt})

#### **In-and-Out Agent Prompt**

Plaintext  
PROMPT FOR AGENT \- PHASE 3:  
"Agent, integrate the Mistral AI engine via langchain\_mistral:  
1\. Update progress\_tracker.md with Phase 3 \[IN PROGRESS\].  
2\. Implement backend/app/services/mistral\_service.py with LangChain structured output parsing for EventDraftOutput and FeedbackSummaryOutput.  
3\. Expose endpoints in backend/app/api/v1/endpoints/ai\_assistant.py for /ai/draft-event and /ai/summarize-feedback.  
4\. Add input sanitization and rate limiting to prevent API token exhaustion.  
5\. Create backend/tests/test\_ai.py mocking Mistral response objects to ensure deterministic unit test runs without invoking live credits during CI.  
6\. Verify and update progress\_tracker.md."

### **Phase 4: Production Frontend (Next.js, Tailwind, shadcn/ui, PWA)**

#### **Goal**

Build a responsive, accessible, finished-product UI providing dedicated dashboard views for each of the four roles matching the user journey flow diagram, bundled as an installable PWA.

#### **Agent Directives & Tasks**

1. **Supabase Auth & Session Management**:  
2. 

   * Setup @supabase/ssr with Next.js Middleware (middleware.ts) to inspect session JWT and route user to their role-specific dashboard:  
   * 

     * /student/dashboard  
     *   
     * /organizer/dashboard  
     *   
     * /faculty/dashboard  
     *   
     * /admin/dashboard  
     *   
   * Handle Google OAuth login and callback redirection.  
   *   
3. **Student Flow UI**:  
4. 

   * **Discover**: Event catalog with search bar, department and category filters, and status badges.  
   *   
   * **Event Details**: Rich view displaying venue capacity gauge, registration deadline countdown, and eligibility.  
   *   
   * **Registration & Pass**: One-click registration; displays digital pass with high-contrast QR code generated client-side using qrcode.react.  
   *   
   * **Feedback & Certificate**: Star rating system, comment input, and "Download Certificate" button triggering PDF download.  
   *   
5. **Organizer Flow UI**:  
6. 

   * **Event Creation with AI**: Form fields paired with an "AI Assist" button that pops up a prompt modal, invokes /api/v1/ai/draft-event, and auto-fills title, description, tags, and schedule.  
   *   
   * **Event Management**: Draft vs Submitted tabs, attendee list with search and manual check-in toggle.  
   *   
   * **Built-in QR Scanner**: Dedicated camera-based scanner page (html5-qrcode) allowing organizers to scan student passes directly from mobile or laptop browsers with real-time audio/visual check-in feedback.  
   *   
7. **Faculty Flow UI**:  
8. 

   * Department event queue with "Recommend Approval" and "Request Changes" actions.  
   *   
   * Student participation analytics and exportable CSV reports.  
   *   
9. **Admin Flow UI**:  
10. 

    * Global dashboard showing active registrations, total attendance, and upcoming events.  
    *   
    * User Management table with role-switch dropdown (STUDENT \<-\> ORGANIZER \<-\> FACULTY \<-\> ADMIN) and activation toggles.  
    *   
    * Final Event Approval modal with side-by-side venue clash detection.  
    *   
    * Audit Log viewer showing system-wide operational trails.  
    *   
11. **PWA Configuration**:  
12. 

    * public/manifest.json configured with college branding, standalone display, and theme colors.  
    *   
    * Service worker caching static assets and enabling offline display of downloaded student tickets.  
    * 

#### **In-and-Out Agent Prompt**

Plaintext  
PROMPT FOR AGENT \- PHASE 4:  
"Agent, construct the complete Next.js frontend with shadcn/ui and PWA support:  
1\. Update progress\_tracker.md with Phase 4 \[IN PROGRESS\].  
2\. Configure middleware.ts for role-based URL protection using Supabase Auth sessions.  
3\. Build the four role dashboards (/student, /organizer, /faculty, /admin) adhering strictly to the user flow journey image provided.  
4\. Implement the AI Event Assistant modal inside the Organizer event creation workflow.  
5\. Implement the QR ticket display component for Students and the HTML5 camera scanner component for Organizers.  
6\. Configure next-pwa in next.config.mjs with public/manifest.json and test offline pass display.  
7\. Run pnpm build to ensure zero TypeScript errors or SSR hydration issues."

### **Phase 5: Containerization & Kubernetes (GKE) Orchestration**

#### **Goal**

Package the backend and frontend into hardened, minimal container images, and write declarative Kubernetes manifests for GKE deployment.

#### **Agent Directives & Tasks**

1. **Backend Dockerfile (**backend/Dockerfile**)**:  
2. 

   * Multi-stage build using python:3.11-slim.  
   *   
   * Run as non-root user (appuser, UID 10001).  
   *   
   * Healthcheck targeting /healthz.  
   *   
3. **Frontend Dockerfile (**frontend/Dockerfile**)**:  
4. 

   * Multi-stage build using node:20-alpine.  
   *   
   * Leverage Next.js standalone output mode (output: 'standalone' in next.config.mjs).  
   *   
   * Run as nextjs non-root user.  
   *   
5. **Kubernetes Declarations (**k8s/base/**)**:  
6. 

   * namespace.yaml: campus-events.  
   *   
   * configmap.yaml: Non-sensitive configuration (API URLs, environment names).  
   *   
   * secrets.yaml.example: Templates for Supabase, Mistral, and DB secrets.  
   *   
   * backend-deployment.yaml & frontend-deployment.yaml:  
   * 

     * Explicit CPU/Memory requests and limits.  
     *   
     * Liveness and readiness probes (/healthz for backend, /api/health for frontend).  
     *   
   * ingress.yaml: Ingress controller rules routing /api traffic to the FastAPI service and root / traffic to Next.js.  
   * 

#### **Kubernetes Manifest Reference (**k8s/base/backend-deployment.yaml**)**

YAML  
apiVersion: apps/v1  
kind: Deployment  
metadata:  
  name: backend-deployment  
  namespace: campus-events  
  labels:  
    app: campus-events-backend  
spec:  
  replicas: 2  
  selector:  
    matchLabels:  
      app: campus-events-backend  
  template:  
    metadata:  
      labels:  
        app: campus-events-backend  
    spec:  
      containers:  
      \- name: backend  
        image: LOCATION-docker.pkg.dev/PROJECT\_ID/campus-events-repo/backend:latest  
        imagePullPolicy: Always  
        ports:  
        \- containerPort: 8000  
        envFrom:  
        \- configMapRef:  
            name: campus-events-config  
        \- secretRef:  
            name: campus-events-secrets  
        resources:  
          requests:  
            cpu: "250m"  
            memory: "512Mi"  
          limits:  
            cpu: "500m"  
            memory: "1Gi"  
        readinessProbe:  
          httpGet:  
            path: /healthz  
            port: 8000  
          initialDelaySeconds: 5  
          periodSeconds: 10  
        livenessProbe:  
          httpGet:  
            path: /healthz  
            port: 8000  
          initialDelaySeconds: 15  
          periodSeconds: 20  
        securityContext:  
          runAsNonRoot: true  
          runAsUser: 10001  
          allowPrivilegeEscalation: false

#### **In-and-Out Agent Prompt**

Plaintext  
PROMPT FOR AGENT \- PHASE 5:  
"Agent, containerize the application and build Kubernetes orchestration manifests:  
1\. Update progress\_tracker.md with Phase 5 \[IN PROGRESS\].  
2\. Write production Dockerfiles for both backend and frontend using multi-stage builds and non-root users.  
3\. Enable standalone output in frontend/next.config.mjs.  
4\. Create complete Kubernetes manifests under k8s/base/ including namespace, deployment, service, ingress, configmap, and secrets template.  
5\. Validate syntax with docker build locally and dry-run k8s files using kubectl apply \--dry-run=client \-k k8s/base."

### **Phase 6: GitHub Actions CI/CD Pipeline & GCP Deployment**

#### **Goal**

Build automated CI/CD pipelines in GitHub Actions to run linters, execute unit tests, build Docker images, publish them to GCP Artifact Registry, and trigger rollout updates on GKE.

#### **Agent Directives & Tasks**

1. **Backend Workflow (**.github/workflows/backend-ci-cd.yaml**)**:  
2. 

   * Trigger on push to main with changes in backend/\*\* or k8s/\*\*.  
   *   
   * Steps:  
   * 

     * Set up Python, install dependencies, run pytest.  
     *   
     * Authenticate with GCP via Service Account Key / Workload Identity.  
     *   
     * Configure Docker CLI for GCP Artifact Registry.  
     *   
     * Build, tag with \$GITHUB\_SHA, and push image to Artifact Registry.  
     *   
     * Authenticate to GKE cluster.  
     *   
     * Deploy updated manifests using kustomize / kubectl set image.  
     *   
3. **Frontend Workflow (**.github/workflows/frontend-ci-cd.yaml**)**:  
4. 

   * Trigger on push to main with changes in frontend/\*\*.  
   *   
   * Steps:  
   * 

     * Set up Node.js, install dependencies, run linter and type-check (tsc \--noEmit).  
     *   
     * Build and push Docker image to Artifact Registry.  
     *   
     * Rollout restart frontend deployment on GKE.  
     * 

#### **GitHub Actions Workflow Specification (**.github/workflows/backend-ci-cd.yaml**)**

YAML  
name: Backend CI/CD Pipeline

on:  
  push:  
    branches: \[ main \]  
    paths:  
      \- 'backend/\*\*'  
      \- 'k8s/\*\*'  
      \- '.github/workflows/backend-ci-cd.yaml'

env:  
  PROJECT\_ID: \${{ secrets.GCP\_PROJECT\_ID }}  
  GAR\_LOCATION: us-central1  
  REPOSITORY: campus-events-repo  
  IMAGE\_NAME: backend  
  CLUSTER\_NAME: campus-events-cluster  
  CLUSTER\_ZONE: us-central1-a

jobs:  
  test:  
    name: Backend Test Suite  
    runs-on: ubuntu-latest  
    defaults:  
      run:  
        working-directory: ./backend  
    steps:  
      \- uses: actions/checkout@v4  
      \- name: Set up Python  
        uses: actions/setup-python@v5  
        with:  
          python-version: '3.11'  
          cache: 'pip'  
      \- name: Install dependencies  
        run: |  
          python \-m pip install \--upgrade pip  
          pip install \-r requirements.txt  
      \- name: Run Pytest  
        env:  
          SUPABASE\_URL: \${{ secrets.SUPABASE\_URL }}  
          SUPABASE\_JWT\_SECRET: "test-secret-at-least-32-chars-long"  
          MISTRAL\_API\_KEY: "dummy-key-for-mock-tests"  
        run: pytest tests/

  build-and-deploy:  
    name: Build, Push & Deploy to GKE  
    needs: test  
    runs-on: ubuntu-latest  
    steps:  
      \- uses: actions/checkout@v4

      \- name: Google Cloud Auth  
        uses: google-github-actions/auth@v2  
        with:  
          credentials\_json: \${{ secrets.GCP\_SA\_KEY }}

      \- name: Set up Cloud SDK  
        uses: google-github-actions/setup-gcloud@v2

      \- name: Configure Docker for Artifact Registry  
        run: gcloud auth configure-docker \${{ env.GAR\_LOCATION }}-docker.pkg.dev \--quiet

      \- name: Build and Push Docker Image  
        run: |  
          IMAGE\_TAG\=$env.GA{R}_{L}OCATION-docker.pkg.dev/${{ env.PROJECT\_ID }}/$env.REPOSITORY/${{ env.IMAGE\_NAME }}:$github.shaLATES{T}_{T}AG=${{ env.GAR\_LOCATION }}-docker.pkg.dev/$env.PROJEC{T}_{I}D/${{ env.REPOSITORY }}/\${{ env.IMAGE\_NAME }}:latest  
          docker build \-t \$IMAGE\_TAG \-t \$LATEST\_TAG ./backend  
          docker push \$IMAGE\_TAG  
          docker push \$LATEST\_TAG

      \- name: Get GKE Credentials  
        uses: google-github-actions/get-gke-credentials@v2  
        with:  
          cluster\_name: \${{ env.CLUSTER\_NAME }}  
          location: \${{ env.CLUSTER\_ZONE }}

      \- name: Deploy to GKE  
        run: |  
          kubectl set image deployment/backend-deployment \\  
            backend\=$env.GA{R}_{L}OCATION-docker.pkg.dev/${{ env.PROJECT\_ID }}/$env.REPOSITORY/${{ env.IMAGE\_NAME }}:\${{ github.sha }} \\  
            \-n campus-events  
          kubectl rollout status deployment/backend-deployment \-n campus-events \--timeout=180s

#### **In-and-Out Agent Prompt**

Plaintext  
PROMPT FOR AGENT \- PHASE 6:  
"Agent, implement the CI/CD pipelines and deployment scripts:  
1\. Update progress\_tracker.md with Phase 6 \[IN PROGRESS\].  
2\. Write .github/workflows/backend-ci-cd.yaml and .github/workflows/frontend-ci-cd.yaml.  
3\. Provide precise instructions in docs/CI\_CD\_SETUP.md detailing which GitHub Secrets must be added.  
4\. Add safety checks: zero deploy triggers if test suites fail.  
5\. Commit and verify pipeline syntax."

### **Phase 7: Verification, End-to-End Testing & Lab Documentation**

#### **Goal**

Perform end-to-end user scenario validation across all four personas, verify failover/rollouts, and assemble the micro-project submission report.

#### **Agent Directives & Tasks**

1. **User Flow Validation Checklist**:  
2. 

   * **Student Journey**: Google Login \-\> Browse Events \-\> Register \-\> Obtain QR Pass \-\> Simulate attendance check-in \-\> Rate event \-\> Download certificate.  
   *   
   * **Organizer Journey**: Login \-\> Draft event using Mistral AI assistant \-\> Submit for Approval \-\> Open scanner and scan student pass \-\> View attendance analytics.  
   *   
   * **Faculty Journey**: View department events \-\> Recommend approval \-\> View participation breakdown \-\> Download department report.  
   *   
   * **Admin Journey**: View admin metrics \-\> Grant/revoke user roles \-\> Check venue clashes \-\> Give final approval \-\> Check audit trail logs.  
   *   
3. **Cluster Health & Ingress Smoke Test**:  
4. 

   * Validate zero-downtime rolling update via kubectl rollout restart deployment/backend-deployment \-n campus-events.  
   *   
   * Validate SSL certificate issuance and routing via Ingress.  
   *   
5. **Lab Micro-Project Documentation**:  
6. 

   * Generate docs/LAB\_REPORT.md containing architectural diagrams, GCP billing/resource breakdown, CI/CD pipeline run logs, and role matrix.  
   * 

## **6\. Step-by-Step Cloud & Tooling Setup Guides**

### **6.1 Supabase & Google OAuth Configuration Guide**

1. **Create Supabase Project**:  
2. 

   * Go to [Supabase Console](https://www.google.com/search?q=https://database.new) and create a project named college-event-system.  
   *   
   * Copy the Project URL, anon public key, service\_role key, and JWT Secret from **Settings \> API**.  
   *   
3. **Configure Google Cloud Console OAuth**:  
4. 

   * Visit [GCP Credentials Console](https://www.google.com/search?q=https://console.cloud.google.com/apis/credentials).  
   *   
   * Create an **OAuth 2.0 Client ID** with Application Type **Web application**.  
   *   
   * Under **Authorized redirect URIs**, add your Supabase redirect URI:  
   * https\://\<YOUR-PROJECT-REF\>.supabase.co/auth/v1/callback  
   *   
   * Copy the generated **Client ID** and **Client Secret**.  
   *   
5. **Link Google Provider in Supabase**:  
6. 

   * In Supabase, navigate to **Authentication \> Providers \> Google**.  
   *   
   * Toggle **Enable Google provider**, paste the Client ID and Secret, and click **Save**.  
   * 

### **6.2 GCP Infrastructure Setup Guide (Artifact Registry & GKE)**

Run these commands using the Google Cloud SDK (gcloud CLI):

Bash  
\# 1\. Login and set project  
gcloud auth login  
export PROJECT\_ID="your-gcp-project-id"  
export REGION="us-central1"  
export ZONE="us-central1-a"  
gcloud config set project \$PROJECT\_ID

\# 2\. Enable necessary APIs  
gcloud services enable \\  
    container.googleapis.com \\  
    artifactregistry.googleapis.com \\  
    cloudbuild.googleapis.com

\# 3\. Create Artifact Registry repository for Docker images  
gcloud artifacts repositories create campus-events-repo \\  
    \--repository-format=docker \\  
    \--location=\$REGION \\  
    \--description="Docker repository for College Event Management System"

\# 4\. Create GKE Autopilot or Standard Cluster  
gcloud container clusters create campus-events-cluster \\  
    \--zone \$ZONE \\  
    \--num-nodes 2 \\  
    \--machine-type e2-standard-2 \\  
    \--enable-ip-alias

\# 5\. Get cluster access credentials locally  
gcloud container clusters get-credentials campus-events-cluster \--zone \$ZONE

\# 6\. Create Service Account for GitHub Actions CI/CD  
gcloud iam service-accounts create github-actions-sa \\  
    \--display-name="GitHub Actions Deployment SA"

\# 7\. Grant necessary IAM roles  
gcloud projects add-iam-policy-binding \$PROJECT\_ID \\  
    \--member="serviceAccount:github-actions-sa@\$PROJECT\_ID.iam.gserviceaccount.com" \\  
    \--role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding \$PROJECT\_ID \\  
    \--member="serviceAccount:github-actions-sa@\$PROJECT\_ID.iam.gserviceaccount.com" \\  
    \--role="roles/container.developer"

\# 8\. Generate and download key for GitHub Secrets  
gcloud iam service-accounts keys create sa-key.json \\  
    \--iam-account=github-actions-sa@\$PROJECT\_ID.iam.gserviceaccount.com

### **6.3 GitHub Repository Secrets Configuration Guide**

In your GitHub repository, navigate to **Settings \> Secrets and variables \> Actions \> New repository secret** and add the following:

| Secret Name | Value Description |
| :---- | :---- |
| GCP\_PROJECT\_ID | Your GCP Project ID string |
| GCP\_SA\_KEY | Full contents of the generated sa-key.json file |
| SUPABASE\_URL | Your Supabase Project URL (\[https\://xxxx.supabase.co\](https\://xxxx.supabase.co)) |
| SUPABASE\_ANON\_KEY | Supabase public anonymous key |
| SUPABASE\_SERVICE\_ROLE\_KEY | Supabase service role secret key |
| SUPABASE\_JWT\_SECRET | Supabase JWT Secret string (used for backend token verification) |
| MISTRAL\_API\_KEY | Mistral AI API key from your Mistral Console |

## **7\. Master Coding Agent Execution Instructions**

**Notice to Coding Agent:**

1. Do not ask for further design guidance on the user journeys or role hierarchy; they are fully specified above.  
2.   
3. Implement the phases sequentially (Phase 1 through Phase 7).  
4.   
5. Read docs/ARCHITECTURE.md and progress\_tracker.md at the beginning of each session.  
6.   
7. Keep progress\_tracker.md updated with timestamped records for every completed sub-task and test run.  
8.   
9. Never leave broken builds or failing tests at the end of a sprint session.

