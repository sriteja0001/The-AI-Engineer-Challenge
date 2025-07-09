'use client'

import React, { useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type Mode = 'explaining' | 'quiz'

export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [mode, setMode] = useState<Mode>('explaining')

  // System prompts for each mode
  const systemPrompts: Record<Mode, string> = {
    explaining: "You are a study assistant. Explain with clarity and thoroughness, as if teaching a student. Use straightforward language and format in bullet points.",
    quiz: "You are a study assistant. Generate 3 multiple-choice questions (with 4 options each) about the following topic for a student quiz. Do not reveal the correct answer until the end of the message after all of the questions are asked."
  }

  // Handle PDF upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !apiKey) return
    setPdfUploading(true)
    setUploadError(null)
    setSessionId(null)
    setAnswer(null)
    setChatError(null)
    setMessages([])
    const formData = new FormData()
    formData.append('file', e.target.files[0])
    formData.append('api_key', apiKey)
    try {
      const res = await fetch('/api/upload_pdf', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setSessionId(data.session_id)
    } catch (err: any) {
      setUploadError('Upload failed: ' + (err?.message || 'Unknown error'))
    } finally {
      setPdfUploading(false)
    }
  }

  // Handle chat
  const handleAsk = async () => {
    if (!sessionId || !question || !apiKey) return
    setAnswer(null)
    setChatError(null)
    const userMsg: Message = { role: 'user', content: question }
    setMessages(prev => [...prev, userMsg])
    try {
      const res = await fetch('/api/chat_pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_message: question,
          api_key: apiKey,
          system_prompt: systemPrompts[mode],
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setAnswer(data.answer)
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (err: any) {
      setChatError('Chat failed: ' + (err?.message || 'Unknown error'))
    }
    setQuestion('')
  }

  const handleClearChat = () => {
    setMessages([])
    setAnswer(null)
    setChatError(null)
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2>PDF Study Assistant</h2>
      <div style={{ margin: '16px 0' }}>
        <label>
          <b>OpenAI API Key:</b>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            style={{ marginLeft: 8, width: 300 }}
            placeholder="sk-..."
          />
        </label>
      </div>
      <div style={{ margin: '16px 0' }}>
        <input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={pdfUploading || !apiKey} />
        {pdfUploading && <span style={{ marginLeft: 8 }}>Uploading...</span>}
        {uploadError && <div style={{ color: 'red' }}>{uploadError}</div>}
        {sessionId && <div style={{ color: 'green' }}>PDF uploaded! You can now ask questions.</div>}
      </div>
      {sessionId && (
        <>
          <div style={{ margin: '16px 0' }}>
            <b>Mode:</b>
            <button
              style={{
                marginLeft: 8,
                background: mode === 'explaining' ? '#3b82f6' : '#eee',
                color: mode === 'explaining' ? '#fff' : '#222',
                border: 'none',
                borderRadius: 4,
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: mode === 'explaining' ? 600 : 400,
              }}
              onClick={() => setMode('explaining')}
            >
              Explaining
            </button>
            <button
              style={{
                marginLeft: 8,
                background: mode === 'quiz' ? '#3b82f6' : '#eee',
                color: mode === 'quiz' ? '#fff' : '#222',
                border: 'none',
                borderRadius: 4,
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: mode === 'quiz' ? 600 : 400,
              }}
              onClick={() => setMode('quiz')}
            >
              Quiz
            </button>
          </div>
          <div style={{ margin: '16px 0', minHeight: 120, background: '#f6f8fa', padding: 12, borderRadius: 4 }}>
            {messages.length === 0 && <div style={{ color: '#888' }}>No messages yet. Ask a question about your PDF!</div>}
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                margin: '8px 0',
                textAlign: msg.role === 'user' ? 'right' : 'left',
              }}>
                <span style={{
                  display: 'inline-block',
                  background: msg.role === 'user' ? '#dbeafe' : '#e5e7eb',
                  color: '#222',
                  borderRadius: 8,
                  padding: '8px 12px',
                  maxWidth: '80%',
                  fontWeight: msg.role === 'user' ? 600 : 400,
                }}>{msg.content}</span>
              </div>
            ))}
          </div>
          <div style={{ margin: '16px 0' }}>
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={mode === 'quiz' ? 'Enter a topic for quiz questions...' : 'Ask a question about your PDF...'}
              style={{ width: 400 }}
              onKeyDown={e => { if (e.key === 'Enter') handleAsk() }}
            />
            <button onClick={handleAsk} style={{ marginLeft: 8 }}>Ask</button>
            <button onClick={handleClearChat} style={{ marginLeft: 8, background: '#eee', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>Clear Chat</button>
          </div>
        </>
      )}
      {chatError && <div style={{ color: 'red' }}>{chatError}</div>}
    </div>
  )
} 