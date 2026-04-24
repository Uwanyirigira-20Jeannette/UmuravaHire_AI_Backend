# UmuravaHire AI – Backend

UmuravaHire AI Backend is a Node.js and TypeScript-based API that powers AI-driven candidate screening and ranking. It integrates with Gemini AI to analyze applicants and generate explainable hiring insights.

## Features

* RESTful API for job and candidate management
* Candidate data ingestion (CSV, Excel, PDF parsing)
* AI-powered screening using Gemini API
* Candidate scoring and ranking logic
* Explainable AI outputs:

  * Match score (0–100)
  * Strengths
  * Gaps
  * Recommendations
* Top N candidate shortlist generation

## AI Capabilities

* Multi-candidate evaluation
* Job-to-candidate matching
* Structured JSON output for frontend use
* Explainable decision-making

## Tech Stack

* Node.js
* TypeScript
* Express.js
* MongoDB (Atlas)
* Gemini API (LLM)

## Environment Variables

Create a `.env` file:

MONGO_URI=your_mongodb_connection
GEMINI_API_KEY=your_api_key
PORT=5000

## Installation

```bash
npm install
npm run dev
```

## Deployment

Recommended:

* Render / Railway (Backend hosting)
* MongoDB Atlas (Database)

## Purpose

This backend is designed to simulate a real-world AI recruitment engine that supports scalable, transparent, and efficient hiring workflows.

##  API Responsibilities

* Process job requirements
* Parse candidate data
* Trigger AI screening
* Return ranked shortlist results

