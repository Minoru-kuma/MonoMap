import React, { useEffect, useState } from 'react'
import { fetchCases, createCase, deleteCase, fetchItems, caseQrImageUrl } from '../api.js'

export default function CaseDetail({ rack, onClose }) {
  const [cases, setCases] = useState([])
  const [items, setItems] = useState({})
  const [expandedCase, setExpandedCase] = useState(null)
  const [showQr, setShowQr] = useState(null)

  useEffect(() => {
    fetchCases(rack.id).then(setCases)
  }, [rack.id])

  const loadItems = async (caseId) => {
    if (items[caseId]) return
    const data = await fetchItems({ case_id: caseId })
    setItems(prev => ({ ...prev, [caseId]: data }))
  }

  const handleToggle = (caseId) => {
    if (expandedCase === caseId) {
      setExpandedCase(null)
    } else {
      setExpandedCase(caseId)
      loadItems(caseId)
    }
  }

  const handleAddCase = async () => {
    const newCase = await createCase({ rack_id: rack.id })
    setCases(prev => [...prev, newCase])
  }

  const handleDeleteCase = async (id) => {
    if (!window.confirm('このケースとその備品を削除しますか？')) return
    await deleteCase(id)
    setCases(prev => prev.filter(c => c.id !== id))
    if (expandedCase === id) setExpandedCase(null)
  }

  const handleDeleteItem = async (caseId, itemId) => {
    const { deleteItem } = await import('../api.js')
    await deleteItem(itemId)
    setItems(prev => ({ ...prev, [caseId]: prev[caseId].filter(i => i.id !== itemId) }))
  }

  return (
    <div className="case-panel">
      <div className="case-panel-header">
        <h3>📦 {rack.name}のケース一覧</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleAddCase} className="btn-add">＋ ケース追加</button>
          <button onClick={onClose} className="btn-close">✕ 閉じる</button>
        </div>
      </div>

      {cases.length === 0 && <p className="empty">ケースがありません</p>}

      {cases.map(c => (
        <div key={c.id} className="case-item">
          <div className="case-row" onClick={() => handleToggle(c.id)}>
            <span>{expandedCase === c.id ? '▾' : '▸'} ケース #{c.id}</span>
            <div style={{ display: 'flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
              <button className="btn-qr" onClick={() => setShowQr(showQr === c.id ? null : c.id)}>QR</button>
              <button className="btn-del" onClick={() => handleDeleteCase(c.id)}>削除</button>
            </div>
          </div>

          {showQr === c.id && (
            <div className="qr-wrap">
              <img src={caseQrImageUrl(c.id)} alt={`QR for case ${c.id}`} className="qr-img" />
              <p className="qr-code">{c.qr_code}</p>
            </div>
          )}

          {expandedCase === c.id && (
            <div className="items-list">
              {(items[c.id] || []).length === 0 && <p className="empty-items">備品なし</p>}
              {(items[c.id] || []).map(item => (
                <div key={item.id} className="item-row">
                  {item.image_path && (
                    <img src={item.image_path} alt={item.name} className="item-thumb" />
                  )}
                  <span className="item-name">{item.name}</span>
                  {item.ai_label && <span className="item-label">AI: {item.ai_label}</span>}
                  <button className="btn-del-sm" onClick={() => handleDeleteItem(c.id, item.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <style>{`
        .case-panel { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-top: 0.5rem; }
        .case-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .case-panel-header h3 { font-size: 1rem; }
        .empty { color: #888; font-size: 0.9rem; }
        .case-item { border: 1px solid #eee; border-radius: 6px; margin-bottom: 0.5rem; overflow: hidden; }
        .case-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; cursor: pointer; background: #f8f8f8; }
        .case-row:hover { background: #eef2ff; }
        .qr-wrap { padding: 0.5rem; text-align: center; background: #fff; }
        .qr-img { width: 140px; height: 140px; }
        .qr-code { font-size: 0.7rem; color: #888; word-break: break-all; }
        .items-list { padding: 0.5rem 0.75rem; display: flex; flex-direction: column; gap: 0.3rem; }
        .empty-items { font-size: 0.85rem; color: #aaa; }
        .item-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.2rem 0; }
        .item-thumb { width: 36px; height: 36px; object-fit: cover; border-radius: 4px; }
        .item-name { flex: 1; font-size: 0.9rem; }
        .item-label { font-size: 0.75rem; color: #888; background: #f0f0f0; border-radius: 4px; padding: 0.1rem 0.4rem; }
        .btn-add { padding: 0.35rem 0.7rem; background: #4a6fa5; color: #fff; border: none; border-radius: 5px; font-size: 0.85rem; }
        .btn-close { padding: 0.35rem 0.7rem; background: #888; color: #fff; border: none; border-radius: 5px; font-size: 0.85rem; }
        .btn-qr { padding: 0.25rem 0.5rem; background: #2ecc71; color: #fff; border: none; border-radius: 4px; font-size: 0.78rem; }
        .btn-del { padding: 0.25rem 0.5rem; background: #e94560; color: #fff; border: none; border-radius: 4px; font-size: 0.78rem; }
        .btn-del-sm { padding: 0.15rem 0.4rem; background: #e94560; color: #fff; border: none; border-radius: 4px; font-size: 0.75rem; margin-left: auto; }
      `}</style>
    </div>
  )
}
