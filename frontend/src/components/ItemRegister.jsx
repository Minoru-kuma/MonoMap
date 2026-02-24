import React, { useEffect, useRef, useState } from 'react'
import { fetchCases, createCase, createItem, detectItem } from '../api.js'
import { fetchRacks } from '../api.js'

export default function ItemRegister() {
  const [racks, setRacks] = useState([])
  const [cases, setCases] = useState([])
  const [selectedRack, setSelectedRack] = useState('')
  const [selectedCase, setSelectedCase] = useState('')
  const [itemName, setItemName] = useState('')
  const [aiLabel, setAiLabel] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [detecting, setDetecting] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)
  const videoRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)
  const streamRef = useRef(null)
  const JPEG_QUALITY = 0.85 // Balance between file size and image quality

  useEffect(() => {
    fetchRacks().then(setRacks)
  }, [])

  useEffect(() => {
    if (selectedRack) {
      fetchCases(selectedRack).then(setCases)
      setSelectedCase('')
    }
  }, [selectedRack])

  const handleFileChange = async (file) => {
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
    // Auto-detect
    setDetecting(true)
    try {
      const result = await detectItem(file)
      if (result) {
        setAiLabel(result.label)
        if (!itemName) setItemName(result.label)
      }
    } finally {
      setDetecting(false)
    }
  }

  const startCamera = async () => {
    setCameraActive(true)
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    streamRef.current = stream
    videoRef.current.srcObject = stream
    videoRef.current.play()
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const captureFrame = () => {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    canvas.toBlob(blob => {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      handleFileChange(file)
      stopCamera()
    }, 'image/jpeg', JPEG_QUALITY)
  }

  const handleAddCase = async () => {
    if (!selectedRack) return
    const c = await createCase({ rack_id: parseInt(selectedRack) })
    setCases(prev => [...prev, c])
    setSelectedCase(String(c.id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!itemName.trim() || !selectedCase) return
    const fd = new FormData()
    fd.append('name', itemName.trim())
    fd.append('case_id', selectedCase)
    if (aiLabel) fd.append('ai_label', aiLabel)
    if (imageFile) fd.append('image', imageFile)
    await createItem(fd)
    setSaved(true)
    setItemName('')
    setAiLabel('')
    setImageFile(null)
    setPreview(null)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="register-page">
      <h2>📷 備品を登録する</h2>
      <form className="register-form" onSubmit={handleSubmit}>
        {/* Rack select */}
        <label>棚を選択</label>
        <select value={selectedRack} onChange={e => setSelectedRack(e.target.value)} required>
          <option value="">-- 棚を選択 --</option>
          {racks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        {/* Case select */}
        {selectedRack && (
          <>
            <label>ケースを選択</label>
            <div className="case-select-row">
              <select value={selectedCase} onChange={e => setSelectedCase(e.target.value)} required>
                <option value="">-- ケースを選択 --</option>
                {cases.map(c => <option key={c.id} value={c.id}>ケース #{c.id}</option>)}
              </select>
              <button type="button" onClick={handleAddCase}>＋ 新規ケース</button>
            </div>
          </>
        )}

        {/* Image capture */}
        <label>画像（AIが種類を推定します）</label>
        <div className="image-section">
          {!cameraActive ? (
            <div className="image-buttons">
              <button type="button" onClick={() => fileRef.current.click()}>📁 ファイル選択</button>
              <button type="button" onClick={startCamera}>📷 カメラ撮影</button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => handleFileChange(e.target.files[0])} />
            </div>
          ) : (
            <div className="camera-wrap">
              <video ref={videoRef} className="camera-video" />
              <div className="camera-buttons">
                <button type="button" onClick={captureFrame}>📸 撮影</button>
                <button type="button" onClick={stopCamera}>キャンセル</button>
              </div>
            </div>
          )}
          {preview && <img src={preview} alt="preview" className="preview-img" />}
          {detecting && <p className="ai-status">🤖 AI推定中...</p>}
        </div>

        {/* AI suggestion */}
        {aiLabel && (
          <div className="ai-suggestion">
            <span>🤖 AI推定: <strong>{aiLabel}</strong></span>
            <button type="button" onClick={() => setAiLabel('')}>✕</button>
          </div>
        )}

        {/* Item name */}
        <label>備品名 <span className="required">*</span></label>
        <input
          type="text"
          value={itemName}
          onChange={e => setItemName(e.target.value)}
          placeholder="例：USBケーブル Type-C"
          required
        />

        <button type="submit" className="btn-save" disabled={!itemName.trim() || !selectedCase}>
          ✅ 登録する
        </button>
        {saved && <p className="saved-msg">✔ 登録しました！</p>}
      </form>

      <style>{`
        .register-page { max-width: 560px; margin: 2rem auto; padding: 1.5rem; }
        .register-page h2 { margin-bottom: 1.25rem; font-size: 1.25rem; }
        .register-form { display: flex; flex-direction: column; gap: 0.5rem; }
        .register-form label { font-weight: 600; font-size: 0.9rem; margin-top: 0.5rem; }
        .register-form select, .register-form input[type="text"] { padding: 0.45rem 0.7rem; border: 1px solid #ccc; border-radius: 6px; font-size: 0.95rem; }
        .case-select-row { display: flex; gap: 0.5rem; }
        .case-select-row select { flex: 1; }
        .case-select-row button { padding: 0.4rem 0.75rem; background: #4a6fa5; color: #fff; border: none; border-radius: 6px; font-size: 0.85rem; white-space: nowrap; }
        .image-section { display: flex; flex-direction: column; gap: 0.5rem; }
        .image-buttons { display: flex; gap: 0.5rem; }
        .image-buttons button { padding: 0.4rem 0.8rem; background: #555; color: #fff; border: none; border-radius: 6px; font-size: 0.9rem; }
        .camera-wrap { display: flex; flex-direction: column; gap: 0.4rem; }
        .camera-video { width: 100%; max-width: 480px; border-radius: 8px; background: #000; }
        .camera-buttons { display: flex; gap: 0.5rem; }
        .camera-buttons button { padding: 0.4rem 0.9rem; background: #e94560; color: #fff; border: none; border-radius: 6px; font-size: 0.9rem; }
        .camera-buttons button:first-child { background: #2ecc71; }
        .preview-img { width: 140px; height: 140px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; }
        .ai-status { font-size: 0.85rem; color: #888; }
        .ai-suggestion { display: flex; align-items: center; gap: 0.5rem; background: #fffbe6; border: 1px solid #ffe082; border-radius: 6px; padding: 0.4rem 0.75rem; font-size: 0.9rem; }
        .ai-suggestion button { padding: 0.15rem 0.4rem; background: transparent; border: 1px solid #aaa; border-radius: 4px; font-size: 0.8rem; }
        .required { color: #e94560; }
        .btn-save { padding: 0.6rem 1.2rem; background: #e94560; color: #fff; border: none; border-radius: 8px; font-size: 1rem; margin-top: 0.5rem; }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .saved-msg { color: #2ecc71; font-weight: 600; font-size: 0.9rem; }
      `}</style>
    </div>
  )
}
