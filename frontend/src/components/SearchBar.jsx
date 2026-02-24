import React, { useState } from 'react'
import { searchRacks } from '../api.js'

export default function SearchBar({ onHighlight }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultCount, setResultCount] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) {
      onHighlight([])
      setResultCount(null)
      return
    }
    setLoading(true)
    try {
      const data = await searchRacks(query.trim())
      onHighlight(data.rack_ids)
      setResultCount(data.rack_ids.length)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    onHighlight([])
    setResultCount(null)
  }

  return (
    <div className="search-bar">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="備品名で検索（例：USBケーブル）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? '...' : '🔍 検索'}
        </button>
        {resultCount !== null && (
          <button type="button" onClick={handleClear} className="clear-btn">
            ✕ クリア
          </button>
        )}
      </form>
      {resultCount !== null && (
        <p className="search-result">
          {resultCount > 0
            ? `${resultCount} 棚でヒットしました（マップ上でハイライト表示）`
            : '該当する備品が見つかりませんでした'}
        </p>
      )}
      <style>{`
        .search-bar { padding: 0.75rem 1.5rem; background: #fff; border-bottom: 1px solid #e0e0e0; }
        .search-bar form { display: flex; gap: 0.5rem; align-items: center; }
        .search-bar input { flex: 1; max-width: 480px; padding: 0.45rem 0.75rem; border: 1px solid #ccc; border-radius: 6px; font-size: 0.95rem; }
        .search-bar button { padding: 0.45rem 1rem; border: none; border-radius: 6px; background: #e94560; color: #fff; font-size: 0.95rem; }
        .clear-btn { background: #888 !important; }
        .search-result { margin-top: 0.4rem; font-size: 0.85rem; color: #555; }
      `}</style>
    </div>
  )
}
