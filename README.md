# FinSight AI – Unified Financial Intelligence Platform

FinSight AI is a production-ready, full-stack unified financial intelligence platform. It aggregates fragmented transaction logs across multiple payment channels (credit cards, UPI, wallets, bank accounts), automatically classifies merchant categories using Gemini AI, analyzes cashback rewards rules to identify missed savings, and generates personalized budget recommendations.

---

## 🌟 Key Features

1. **Aggregated statement ingestion**: Supports uploading banking CSV spreadsheets, statements in PDF format, transaction SMS text blocks, or receipt images (OCR parsing via Tesseract with Gemini field structuring).
2. **AI Transaction Classification Agent (Agent 1)**: Automatically classifies merchant transaction payees into standard spending channels (Food, Travel, Shopping, Bills, Healthcare, Education, Entertainment, Investments, Others) using Gemini-1.5-Flash with local heuristic keyword fallback.
3. **Cashback Intelligence Engine (Agent 2)**: Evaluates transaction payment methods against a database of card rewards rules (e.g., Amazon Pay ICICI, Axis Ace, SBI Cashback) to compute earned vs potential rewards and recommended optimal cards.
4. **Offer Explainability Agent (Agent 3)**: Translates complex legal credit card or bank offer terms into a single, clean instructions line (e.g., spent threshold, percentage discount, maximum cap).
5. **AI Financial Advisor Agent (Agent 4)**: Generates actionable advice, spending category alerts, and card swap savings warnings.
6. **Reconciliation Agent (Agent 5)**: Automatically identifies duplicate debits (same merchant, amount, and day within 15 minutes) or mismatched transaction entries.
7. **Interactive Glassmorphism Dashboard**: Display metrics (total spend, earned cashback, missed rewards, best payment method) with responsive Recharts visualizations.

---

## 📂 Project Structure

```
d:\FRD/
├── docker-compose.yml          # Container configuration orchestrator
├── init.sql                    # Base SQL schemas and pre-seeded demo records
├── README.md                   # Main project documentation
├── DEPLOYMENT.md               # Production deployment guide
├── backend/
│   ├── Dockerfile              # Python container compiler (includes Tesseract)
│   ├── requirements.txt        # FastAPI application dependencies
│   ├── .env.example            # Configuration env parameters template
│   └── app/
│       ├── main.py             # FastAPI bootstrap entrypoint
│       ├── config.py           # Pydantic Settings validator
│       ├── database.py         # SQLAlchemy engine sessionpool
│       ├── models.py           # Database entities (User, Transaction, etc.)
│       ├── schemas.py          # Pydantic schema validation layers
│       ├── security.py         # Bcrypt hashing and JWT token handlers
│       ├── test_main.py        # Automated backend unit tests
│       ├── api/                # Route endpoints
│       │   ├── auth.py         # Signups, logins, and database sandbox reset
│       │   ├── transactions.py # CRUD and aggregate statement parser uploads
│       │   ├── cashback.py     # Credit card rules management
│       │   ├── offers.py       # Active offers and simplifier agent bindings
│       │   ├── insights.py     # Dashboard summaries and recommendations
│       │   └── reconciliation.py # Discrepancy controls
│       └── services/           # Business logic layer
│           ├── gemini_service.py # Gemini connection client
│           ├── agents.py       # 5 Specialized AI Agents
│           └── ocr_service.py  # Text statement and image OCR parser
└── frontend/
    ├── Dockerfile              # Node container compiler
    ├── package.json            # Next.js configurations
    ├── tsconfig.json           # TS compiling guidelines
    ├── tailwind.config.ts      # Tailwind selectors
    ├── postcss.config.js       # PostCSS processing
    ├── next.config.ts          # Next.js settings
    ├── .env.local.example      # Frontend API base URL template
    └── app/
        ├── layout.tsx          # Root page metadata wrappers
        ├── page.tsx            # Main landing view
        ├── globals.css         # Dark glass card styling HSL variables
        ├── login/              # Auth logins page
        ├── dashboard/          # Metrics cards and Recharts trends view
        ├── transactions/       # Log history, search filters, and manual entry
        ├── cashback/           # Credit card parameters lists
        ├── offers/             # Bank promotional terms explainability Agent UI
        ├── insights/           # Savings advisory cards
        ├── profile/            # sandbox pre-seeded DB reset
        ├── lib/
        │   ├── api.ts          # Axios route configurations
        │   └── utils.ts        # Currency (INR) and date formatters
        └── components/         # Reusable panels
            ├── Sidebar.tsx     # Navigation layouts
            ├── Topbar.tsx      # User profile headers
            ├── ThemeToggle.tsx # Light/Dark mode toggler
            └── ui/             # Shadcn-like primitive layouts
```

---

## 🛠️ Installation & Setup

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/) (Version 20.10+ / Compose v2.0+)
- Gemini API Key (Create one for free in [Google AI Studio](https://aistudio.google.com/))

### Step 1: Configure Environment Variables
Create a `.env` file in the root directory:
```bash
# Root .env file
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Step 2: Build and Run Containers
Deploy the application stack (Database, Backend, and Frontend) in one command:
```bash
docker-compose up --build
```
This command compiles the frontend and backend Dockerfiles, creates a PostgreSQL instance, runs standard SQL tables setup, and seeds baseline records.

### Step 3: Access the Platform
Once boot logs settle:
* **Frontend**: Open `http://localhost:3000` in your web browser.
* **Backend API Docs**: Explore FastAPI Swagger documentation at `http://localhost:8000/docs`.

---

## 🔑 Seeding / Demo Access

We have pre-configured a demo account to enable immediate exploration:
* **Username / Email**: `demo@finsight.ai`
* **Password**: `password123`

### Restoring Seed State
If you delete records or upload test statement logs and wish to return to a clean demo baseline:
1. Navigate to `/profile` in the sidebar.
2. Under **Developer Sandbox Settings**, click **Reset & Pre-seed Database**.
3. The platform will refresh the card rules database, sample credit transactions, duplicate alarms, and insights for user `demo@finsight.ai`.

---

## 🧪 Running Backend Unit Tests

To verify statement extraction regex, card matcher rewards calculations, and duplicate reconciliation filters:
```bash
docker-compose exec backend python -m unittest app/test_main.py
```
This runs the unit tests inside the backend container container and logs verification results.
