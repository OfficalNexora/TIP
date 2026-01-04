# AI Ethics Evaluator (UNESCO Framework) - Prototype

This is a prototype web application assessing documents against the UNESCO AI Ethics Framework (2021) with Filipino explanations.

## Prerequisites
- Node.js (v16+)
- NPM

## Installation

1. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Install Client Dependencies**
   ```bash
   cd client
   npm install
   ```

## Running the Application

1. **Start the Backend Server**
   ```bash
   cd server
   node index.js
   ```
   *Server runs on http://localhost:3000*

2. **Start the Frontend Client**
   Open a new terminal:
   ```bash
   cd client
   npm run dev
   ```
   *Client typically runs on http://localhost:5173*

## Usage
1. Open the browser to the Client URL (e.g., http://localhost:5173).
2. Upload a PDF or Image containing text to be analyzed.
3. Wait for the parallel analysis (Ethics + Integrity).
4. View the results.

## Notes
- **Winston API**: Uses a **Mock** service for demonstration (simulating Plagiarism/AI scores).
- **Ethics Engine**: Uses Hugging Face API if a key is provided in `server/.env` (HF_API_KEY=your_key). Otherwise, it falls back to a **Mock** response logic to ensure the prototype is testable without keys.
- **Language**: All ethics feedback is in **Filipino**.
