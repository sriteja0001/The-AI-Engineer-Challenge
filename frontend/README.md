# AI Engineer Challenge Frontend

A modern, responsive chat interface built with Next.js and Tailwind CSS that integrates with the FastAPI backend.

## Features

- 🎨 Modern, beautiful UI with smooth animations
- 💬 Real-time streaming chat responses
- 🔐 Secure API key management with password fields
- ⚙️ Customizable system messages
- 📱 Responsive design for all devices
- 🎯 Auto-scrolling chat container
- 🧹 Clear chat functionality

## Prerequisites

- Node.js 18+ and npm
- The FastAPI backend running on `http://localhost:8000`

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```

3. **Open Your Browser**
   Navigate to `http://localhost:3000`

## Usage

1. **Set Your API Key**: Click the settings icon (⚙️) in the top-right corner and enter your OpenAI API key
2. **Customize System Message**: Optionally modify the system message to change the AI's behavior
3. **Start Chatting**: Type your message and press Enter or click Send
4. **Clear Chat**: Use the "Clear Chat" button to start a new conversation

## API Integration

The frontend automatically proxies API requests to your FastAPI backend running on port 8000. Make sure your backend is running before using the frontend.

## Deployment

This frontend is optimized for deployment on Vercel. The `next.config.js` includes proper API routing configuration.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **State Management**: React hooks