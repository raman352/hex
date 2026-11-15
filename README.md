# TechCare DeskPilot

An AI-powered customer support desk, ticket management system, and live knowledge base platform built for **TechCare** (a fictional consumer electronics company).

## Features

- **Customer Support Chatbot (Gemini API)**:
  - Server-side `@google/genai` integration (`POST /api/chat`) using `gemini-4-hydrogen`.
  - Grounded strictly in TechCare's live Knowledge Base (FAQs), policies, product catalog, and sample orders.
  - Supports simple English and Hinglish naturally.
  - Identifies unresolved complaints and offers one-click pre-filled support ticket creation.
  - Persists chat history in `localStorage` with loading states, suggested questions, and error retry.
- **Customer Ticket Creation & Tracker**:
  - Create support tickets with unique IDs (`TKT-2026-xxxx`), customer name, order ID, category, priority, status, and timestamp.
  - Persists across page refreshes via `localStorage`.
- **Admin Support Dashboard**:
  - Live summary counters (Total, Open, In Progress, Resolved).
  - Search by Ticket ID, Customer Name, Order ID, or complaint text.
  - Filter by Status, Priority, and Category.
  - Inline status updates, priority edits, resolution notes, and demo order cross-referencing.
- **Knowledge Base Management**:
  - View, Add, Edit, and Delete FAQs.
  - Updates immediately sync to the AI chatbot for subsequent customer answers.

## Demo Data Notice

All products (`AeroSound Pro ANC Headphones`, `PulseWatch S3 Smartwatch`, `VoltDock 100W GaN Charger`, `ClearView 4K Webcam`), customer orders (`TC-1041`–`TC-1044`), policies, and initial tickets are **fictional demo data**. Never enter real passwords, payment card details, or bank account information.

## Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Set environment variable**:
   Create a `.env` file with your Gemini API key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   ```
3. **Start the development server** (Express backend + Vite frontend on port 3000):
   ```bash
   npm run dev
   ```
4. **Build and run in production**:
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```
