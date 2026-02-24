import React, { useEffect, useRef, useState, useCallback } from 'react'
import { fetchRacks, createRack, updateRack, deleteRack } from '../api.js'
import CaseDetail from './CaseDetail.jsx'

const CANVAS_W = 900
const CANVAS_H = 600
const MIN_SIZE = 40

export default function MapEditor({ highlightedRackIds }) {
  const [racks, setRacks] = useState([])
  const [selectedRack, setSelectedRack] = useState(null)
  const [showCasePanel, setShowCasePanel] = useState(false)
  const [newRackName, setNewRackName] = useState('')

  // Drag state (using refs to avoid re-renders during drag)
  const dragging = useRef(null) // { rackId, offsetX, offsetY }
  const svgRef = useRef(null)

  const load = useCallback(async () => {
    const data = await fetchRacks()
    setRacks(data)
  }, [])

  useEffect(() => { load() }, [load])

  // --- Add rack ---
  const handleAddRack = async () => {
    const name = newRackName.trim() || `棚${racks.length + 1}`
    const rack = await createRack({ name, x: 20, y: 20, width: 120, height: 80 })
    setRacks(prev => [...prev, rack])
    setNewRackName('')
  }

  // --- Delete rack ---
  const handleDeleteRack = async (id) => {
    if (!window.confirm('この棚とそのケース・備品をすべて削除しますか？')) return
    await deleteRack(id)
    setRacks(prev => prev.filter(r => r.id !== id))
    if (selectedRack?.id === id) { setSelectedRack(null); setShowCasePanel(false) }
  }

  // --- SVG coordinate helper ---
  const svgCoords = (e) => {
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    return pt.matrixTransform(svg.getScreenCTM().inverse())
  }

  // --- Drag handlers ---
  const onMouseDown = (e, rack) => {
    if (e.button !== 0) return
    e.preventDefault()
    const { x, y } = svgCoords(e)
    dragging.current = { rackId: rack.id, offsetX: x - rack.x, offsetY: y - rack.y }
  }

  const onMouseMove = (e) => {
    if (!dragging.current) return
    const { x, y } = svgCoords(e)
    const { rackId, offsetX, offsetY } = dragging.current
    const newX = Math.max(0, Math.min(CANVAS_W - MIN_SIZE, x - offsetX))
    const newY = Math.max(0, Math.min(CANVAS_H - MIN_SIZE, y - offsetY))
    setRacks(prev => prev.map(r => r.id === rackId ? { ...r, x: newX, y: newY } : r))
  }

  const onMouseUp = async () => {
    if (!dragging.current) return
    const { rackId } = dragging.current
    dragging.current = null
    const rack = racks.find(r => r.id === rackId)
    if (rack) await updateRack(rackId, { x: rack.x, y: rack.y })
  }

  const onRackClick = (rack) => {
    setSelectedRack(rack)
    setShowCasePanel(true)
  }

  const isHighlighted = (id) => highlightedRackIds.includes(id)

  return (
    <div className="map-editor">
      {/* Toolbar */}
      <div className="map-toolbar">
        <input
          type="text"
          placeholder="棚の名前"
          value={newRackName}
          onChange={e => setNewRackName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddRack()}
        />
        <button onClick={handleAddRack}>＋ 棚を追加</button>
        <span className="hint">棚をドラッグして配置 ／ クリックでケース管理</span>
      </div>

      {/* SVG Map */}
      <div className="map-canvas-wrap">
        <svg
          ref={svgRef}
          className="map-svg"
          width={CANVAS_W}
          height={CANVAS_H}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e0e0e0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {racks.map(rack => {
            const highlighted = isHighlighted(rack.id)
            const isSelected = selectedRack?.id === rack.id
            return (
              <g key={rack.id}>
                <rect
                  x={rack.x}
                  y={rack.y}
                  width={rack.width}
                  height={rack.height}
                  rx={6}
                  fill={highlighted ? '#fff3cd' : '#dde8ff'}
                  stroke={highlighted ? '#e67e22' : isSelected ? '#e94560' : '#4a6fa5'}
                  strokeWidth={highlighted || isSelected ? 3 : 1.5}
                  style={{ cursor: 'grab', userSelect: 'none' }}
                  onMouseDown={e => onMouseDown(e, rack)}
                  onClick={() => onRackClick(rack)}
                />
                <text
                  x={rack.x + rack.width / 2}
                  y={rack.y + rack.height / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="13"
                  fontWeight="600"
                  fill={highlighted ? '#6c3a00' : '#1a3a6e'}
                  pointerEvents="none"
                >
                  {rack.name}
                </text>
                {highlighted && (
                  <text
                    x={rack.x + rack.width / 2}
                    y={rack.y + rack.height - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#e67e22"
                    pointerEvents="none"
                  >
                    ヒット
                  </text>
                )}
                {/* Delete button */}
                <g
                  transform={`translate(${rack.x + rack.width - 12}, ${rack.y + 2})`}
                  style={{ cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); handleDeleteRack(rack.id) }}
                >
                  <circle r="8" fill="#e94560" opacity="0.85" />
                  <text textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#fff">✕</text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Case panel */}
      {showCasePanel && selectedRack && (
        <CaseDetail
          rack={selectedRack}
          onClose={() => { setShowCasePanel(false); setSelectedRack(null) }}
        />
      )}

      <style>{`
        .map-editor { display: flex; flex-direction: column; flex: 1; padding: 1rem 1.5rem; gap: 0.75rem; }
        .map-toolbar { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
        .map-toolbar input { padding: 0.4rem 0.7rem; border: 1px solid #ccc; border-radius: 6px; font-size: 0.9rem; width: 180px; }
        .map-toolbar button { padding: 0.4rem 0.9rem; background: #4a6fa5; color: #fff; border: none; border-radius: 6px; font-size: 0.9rem; }
        .hint { font-size: 0.8rem; color: #888; }
        .map-canvas-wrap { overflow: auto; border: 1px solid #ccc; border-radius: 8px; background: #fafafa; }
        .map-svg { display: block; }
      `}</style>
    </div>
  )
}
