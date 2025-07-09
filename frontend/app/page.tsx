'use client'

import React, { useState } from 'react'

export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)

  // Handle PDF upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !apiKey) return
    setPdfUploading(true)
    setUploadError(null)
    setSessionId(null)
    setAnswer(null)
    setChatError(null)
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
    try {
      const res = await fetch('/api/chat_pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, user_message: question, api_key: apiKey }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setAnswer(data.answer)
    } catch (err: any) {
      setChatError('Chat failed: ' + (err?.message || 'Unknown error'))
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2>PDF RAG Chat Demo</h2>
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
        <div style={{ margin: '16px 0' }}>
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask a question about your PDF..."
            style={{ width: 400 }}
          />
          <button onClick={handleAsk} style={{ marginLeft: 8 }}>Ask</button>
        </div>
      )}
      {answer && (
        <div style={{ margin: '16px 0', background: '#f6f8fa', padding: 12, borderRadius: 4 }}>
          <b>Answer:</b>
          <div>{answer}</div>
        </div>
      )}
      {chatError && <div style={{ color: 'red' }}>{chatError}</div>}
    </div>
  )
} 