# Data Alchemist

## Core Idea

**Data Alchemist** is an AI-powered web application designed to help non-technical users transform messy, real-world resource allocation spreadsheets into clean, validated, and rules-driven configuration files—ready for downstream optimization and planning.

---

## Why Data Alchemist?

Resource allocation in organizations often starts with scattered spreadsheets: clients, workers, and tasks, each in their own format, full of inconsistencies and errors. Traditional tools require technical skills to clean, validate, and prepare this data for automated systems. Data Alchemist bridges this gap with an intuitive, AI-first interface.

---

## What Makes It Special?

### 1. **Natural Language Interaction**
- **Search & Filter:** Users can query data in plain English (e.g., “Show all tasks longer than 2 phases and needing QA skills”).
- **Conversational Data Modification:** Users can type requests like “Change the max load for all workers in Group A to 4” and the AI generates and applies the change safely.

### 2. **AI-Powered Validation & Correction**
- **Automatic Error Detection:** The app checks for missing columns, broken references, skill mismatches, malformed lists, and more—on upload and every edit.
- **AI Suggestions:** For each error, the AI suggests fixes and can even auto-correct with user approval.
- **Readiness Score:** A dynamic score and AI summary help users know when their data is truly ready for export.

### 3. **Rule Creation—UI & Natural Language**
- **Visual Rule Builder:** Users can define business rules (co-run, slot-restriction, load-limit, etc.) via UI.
- **AI Rule Recommendations:** The AI proactively suggests new rules and highlights hidden risks based on patterns in the data.
- **Natural Language to Rule:** Users can describe rules in plain English; the AI converts them into structured logic.

### 4. **Prioritization and Export**
- **Prioritization Controls:** Sliders and inputs let users set what matters most (e.g., fairness, priority fulfillment).
- **One-Click Export:** When all errors are resolved, users export clean CSVs and a rules.json file, ready for downstream allocation engines.

---

## How Does It Work?

1. **Upload:** Drop your clients, workers, and tasks files (CSV/XLSX).
2. **Edit & Validate:** Instantly see errors highlighted in interactive tables. Fix issues inline or accept AI-powered corrections.
3. **Search & Modify:** Use natural language to find and update data.
4. **Define Rules:** Add rules via UI or plain English. Get AI recommendations for missing or risky rules.
5. **Set Priorities:** Adjust sliders to indicate what’s most important for your allocation scenario.
6. **Export:** Download your cleaned data and rules for use in any resource allocation engine.

---

## Who Is It For?

- **Non-technical users** managing complex resource allocation
- **Teams** needing to clean, validate, and structure data for optimization tools
- **Anyone** tired of spreadsheet chaos and manual data wrangling

---

## Tech Stack

- **Frontend:** Next.js, React, Chakra UI
- **AI:** Google Gemini API for natural language understanding, recommendations, validation, and error correction
- **State Management:** Zustand
- **Validation:** Custom logic + AI-powered suggestions

---

## The Vision

**Data Alchemist** is more than a spreadsheet cleaner—it's your AI assistant for data-driven planning. With natural language, smart validation, and proactive guidance, it empowers anyone to create robust, error-free configurations for the next generation of resource optimization.

---
