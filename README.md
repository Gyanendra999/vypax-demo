# Vypax — Operating Layer for International Trade

**Vypax** is a modern B2B technology platform for simplifying international trade and logistics execution workflows.

It unites trade discovery, landed cost economics, documentation, shipment milestones, and tracking into a single operational workspace.

---

## Live Demo & Deployment
- **Development Environment**: [https://ais-dev-hmbzbjjn2jvkbm4x5aakuy-305700405558.asia-southeast1.run.app](https://ais-dev-hmbzbjjn2jvkbm4x5aakuy-305700405558.asia-southeast1.run.app)
- **Applet ID**: `aa3f7cdc-e2b2-4af4-a18d-2606053d2bc4`

---

## The Workflow Hypothesis

```text
Discover → Calculate → Prepare → Book → Execute → Track → Deliver
```

1. **Discover**: Identify viable export corridors, global demand indices, and HS tariff classifications.
2. **Calculate**: Transparently model CIF landed costs, basic customs duties, cess, and gross margins.
3. **Prepare**: Manage and verify critical export documentation (Commercial Invoice, Packing List, Shipping Bill, Certificate of Origin, Bill of Lading).
4. **Book**: Reserve equipment and coordinate container freight stations (CFS) and forwarder allocations.
5. **Execute**: Track customs LEO assessments, container stuffing, and port terminal berth loading.
6. **Track**: Monitor sea transit, vessel departures, voyage waypoints, and shipment exceptions.
7. **Deliver**: Verify destination port arrival, import customs clearance, and proof of receipt.

---

## Features

- **Operations Dashboard**: Real-time operational KPIs, active shipment overview, milestone progress, and exception management.
- **Trade Cost Calculator**: Mathematical landed-cost model factoring CIF value, freight, marine cargo insurance, ad valorem tariffs, and port handling charges.
- **Trade Opportunities**: Trade corridor intelligence with margin estimates and destination-specific compliance checklists.
- **Document Workspace**: Audit-ready document repository with draft generation and high-fidelity printable B2B trade specimens.
- **Shipments Directory & Detail**: End-to-end shipment lifecycle management featuring schematic maritime route visualizations and sequential milestone progression.
- **Partners Directory**: Structured directory for freight forwarders, container freight stations, licensed Customs Brokers, and transporters.
- **Immutable Activity Feed**: Chronological log of document approvals, status updates, and booking requests.
- **Vypax Trade Assistant**: Domain-aware operational assistant providing guidance on Incoterms 2020, customs classification, and compliance.

---

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (Light-first enterprise layout)
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Design Constitution**: Zero-pill discipline, tabular figures for all data, single-elevation depth

---

## Project Structure

```text
├── index.html                   # HTML entry point with metadata and fonts
├── metadata.json                # Project configuration and capabilities
├── package.json                 # Dependencies and build scripts
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── AssistantPanel.tsx       # Trade guidance slide-over
│   │   │   ├── DocumentPreviewModal.tsx # Printable B2B document specimen viewer
│   │   │   ├── Header.tsx               # 3-zone Top Bar Contract
│   │   │   ├── NewShipmentModal.tsx     # Shipment creation modal
│   │   │   ├── RouteVisualizer.tsx      # Schematic maritime route component
│   │   │   ├── Sidebar.tsx              # Operations sidebar navigation
│   │   │   ├── StatusBadge.tsx          # Non-pill semantic status indicators
│   │   │   └── Timeline.tsx             # Milestone chain-of-custody tracker
│   │   └── layout/
│   │       └── DashboardLayout.tsx      # Main workspace shell
│   ├── data/
│   │   └── mockData.ts          # Centralized operational mock datasets
│   ├── pages/
│   │   ├── ActivityPage.tsx     # Operations event feed
│   │   ├── CalculatorPage.tsx   # Landed cost & margin calculator
│   │   ├── DocumentsPage.tsx    # Trade document repository
│   │   ├── LandingPage.tsx      # Welcome & workflow overview
│   │   ├── OpportunitiesPage.tsx# Trade discovery corridors
│   │   ├── OverviewPage.tsx     # Main operational dashboard
│   │   ├── PartnersPage.tsx     # Logistics partners network
│   │   ├── SettingsPage.tsx     # Workspace profile & API boundaries
│   │   ├── ShipmentDetailPage.tsx# Detailed operational view
│   │   └── ShipmentsPage.tsx    # Shipment directory & filter tabs
│   ├── services/
│   │   ├── calculatorService.ts # Landed cost and margin algorithms
│   │   └── tradeService.ts      # Reactive operational state manager
│   ├── types/
│   │   └── trade.ts             # TypeScript trade domain types
│   ├── App.tsx                  # Client-side router configuration
│   ├── index.css                # Global styles and font definitions
│   └── main.tsx                 # React entry point
└── tsconfig.json
```

---

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Dev Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### 3. Build for Production

```bash
npm run build
```

---

## Pushing to GitHub

To push this codebase to your own GitHub repository:

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `vypax`).
2. Run the following commands in the project directory:

```bash
# Initialize git if not already initialized
git init

# Add all files
git add .

# Create the initial commit
git commit -m "Initial commit: Vypax operating layer for international trade"

# Rename branch to main
git branch -M main

# Connect to your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/<YOUR-USERNAME>/vypax.git

# Push to GitHub
git push -u origin main
```
