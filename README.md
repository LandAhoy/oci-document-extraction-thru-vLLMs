# Welcome to OCI Intelligent Document Processing Project

This project is a **proof-of-concept AI demo** built by **Hafeez** for **Bahrain Kuwait Insurance Company (BKIC)**. It demonstrates how Oracle's Generative AI capabilities can be used to automate intelligent document processing and integrate with enterprise data flows.

---

## 🧠 Use Case Overview

This demo is a key component of BKIC’s **document intelligent processing pipeline**. It is designed to:

- **Ingest documents** in various formats such as PDFs, scanned images, and forms
- **Receive documents** from multiple sources including:
  - Email inboxes
  - FTP servers
  - Internal/external web portals
- Leverage **Oracle Integration Cloud (OIC)** for orchestrating and automating the ingestion process
- Pass all documents to this AI engine which performs:
  - **Visual parsing and field extraction** using multimodal LLMs and OCR
  - **Field normalization and enrichment**

The parsed and structured data is then committed to a **centralized Oracle data lakehouse**, powered by:
- **Oracle Database 23AI**
- **Autonomous Database with built-in AI features**

The extracted data is made accessible to:
- BKIC **underwriters** for policy validation
- **Internal business analysts** for operational insights
- **Customer-facing teams** for faster response and self-service capabilities

This demo simulates a highly scalable, AI-enabled ingestion pipeline that accelerates document-heavy processes for modern insurance providers.

---

## 🎯 Intended Audience

This demo is strictly intended for internal use by the:

> **Oracle EMEA AI Center of Excellence (AICOE) Team**

It may be presented to Oracle customers by AICOE team members as part of innovation sessions, workshops, or discovery engagements.  
Any reuse, modification, or deployment outside the AICOE team must be discussed with the project author.

---

## 👤 User Scenario

A BKIC user:
1. Uploads a document (PDF/image) to a portal or sends it via email.
2. The document flows through Oracle Integration Cloud (OIC) to this AI engine.
3. This AI engine:
   - Uses multimodal LLM and OCR to extract key fields
   - Normalizes and formats the extracted data
   - Commits it to the Oracle 23AI-powered data lakehouse
4. Downstream users (underwriters, analysts, or customers) query or visualize this data for their respective use cases.

This flow showcases how **AI + OIC + Autonomous Database** work together to enable real-time, intelligent document automation.

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite + ShadCN UI
- **Styling**: Tailwind CSS
- **Build Tools**: TypeScript, Vite
- **AI Services**: Multimodal LLMs (Llama 4 Maverick leevraged through OpenRouter API)
- **Integration**: Oracle Integration Cloud (OIC)
- **Storage**: Oracle Data Lakehouse (Autonomous Database, 23AI)

---
