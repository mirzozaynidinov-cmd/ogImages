import { useState } from 'react'

export default function UrlInput({ onAnalyze, loading }) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url.trim()) onAnalyze(url.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="url-form">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        className="url-input"
        required
      />
      <button type="submit" className="url-button" disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
    </form>
  )
}
