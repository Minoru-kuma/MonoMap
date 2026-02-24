import React, { useState } from 'react'
import MapEditor from './components/MapEditor.jsx'
import ItemRegister from './components/ItemRegister.jsx'
import SearchBar from './components/SearchBar.jsx'
import './App.css'

export default function App() {
  const [tab, setTab] = useState('map')
  const [highlightedRackIds, setHighlightedRackIds] = useState([])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🗺️ MonoMap</h1>
        <nav>
          <button className={tab === 'map' ? 'active' : ''} onClick={() => setTab('map')}>マップ</button>
          <button className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}>備品登録</button>
        </nav>
      </header>

      <main className="app-main">
        {tab === 'map' && (
          <>
            <SearchBar onHighlight={setHighlightedRackIds} />
            <MapEditor highlightedRackIds={highlightedRackIds} />
          </>
        )}
        {tab === 'register' && <ItemRegister />}
      </main>
    </div>
  )
}
