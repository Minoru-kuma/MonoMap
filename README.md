# MonoMap 🗺️
どこにあるのかわかります – 研究室備品マップ管理アプリ

Raspberry Pi 5 上で動作するローカル Web アプリケーションです。  
QR コード・2D マップ・AI 物体検出（YOLOv8n）を組み合わせて、数百点規模の備品の「物理的な場所」を簡単に管理・検索できます。

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| バックエンド | FastAPI + SQLAlchemy + SQLite |
| AI 推論 | Ultralytics YOLOv8n |
| QR コード | qrcode[pil] |
| フロントエンド | React 18 + Vite |
| 実行環境 | Raspberry Pi 5 / ローカルネットワーク |

---

## ディレクトリ構成

```
MonoMap/
├── backend/
│   ├── main.py           # FastAPI アプリ本体
│   ├── database.py       # SQLAlchemy セットアップ (SQLite)
│   ├── models.py         # ORM モデル (Rack / Case / Item)
│   ├── schemas.py        # Pydantic スキーマ
│   ├── routers/
│   │   ├── racks.py      # 棚 CRUD API
│   │   ├── cases.py      # ケース CRUD + QR コード生成 API
│   │   ├── items.py      # 備品 CRUD + 検索 API
│   │   └── ai.py         # YOLO 物体検出 API
│   ├── ai/
│   │   └── detector.py   # YOLO ラッパー
│   ├── uploads/          # アップロード画像保存先
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js        # バックエンド API クライアント
│   │   └── components/
│   │       ├── MapEditor.jsx     # SVG ドラッグ&ドロップ マップ
│   │       ├── SearchBar.jsx     # 備品名検索
│   │       ├── CaseDetail.jsx    # ケース・備品一覧 + QR 表示
│   │       └── ItemRegister.jsx  # 備品登録（カメラ + AI アシスト）
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
└── docker-compose.yml
```

---

## データモデル

```
Rack (棚)   ─── Case (クリアケース) ─── Item (備品)
id, name,        id, qr_code,             id, name,
x, y,            rack_id                  case_id,
width, height                             image_path,
                                          ai_label
```

---

## セットアップ方法

### 手動起動（開発時）

**バックエンド**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**フロントエンド**
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### Docker Compose（本番 / Raspberry Pi）
```bash
docker compose up --build
# バックエンド: http://<raspberry-pi-ip>:8000
# フロントエンド: http://<raspberry-pi-ip>:5173
```

---

## 主要機能

### 1. 2D マップ管理
- 棚（Rack）をドラッグ＆ドロップで自由に配置
- 棚をクリックしてケース・備品を管理
- 棚を追加・削除

### 2. QR コード管理
- ケース作成時に自動生成される固有 QR コード
- ケース詳細パネルから PNG 画像をダウンロード可能

### 3. AI アシスト登録（YOLOv8n）
- カメラ撮影またはファイル選択で画像をアップロード
- YOLO が物体の種類を推定し、備品名に自動入力
- 人間が確認・修正してから登録する「確認付きフロー」

### 4. 備品検索 + マップハイライト
- 備品名（またはAI推定ラベル）でキーワード検索
- 該当備品が存在する棚がマップ上でオレンジ色にハイライトされる

---

## API エンドポイント一覧

| Method | Path | 説明 |
|---|---|---|
| GET | /api/racks/ | 棚一覧 |
| POST | /api/racks/ | 棚追加 |
| PATCH | /api/racks/{id} | 棚更新（位置・サイズ） |
| DELETE | /api/racks/{id} | 棚削除 |
| GET | /api/cases/ | ケース一覧 |
| POST | /api/cases/ | ケース作成（QR 自動生成） |
| GET | /api/cases/{id}/qr-image | QR コード画像 (PNG) |
| GET | /api/items/ | 備品一覧（`?q=`で検索） |
| POST | /api/items/ | 備品登録（画像アップロード対応） |
| GET | /api/items/search-racks | キーワードにヒットする棚 ID 一覧 |
| POST | /api/ai/detect | 画像から YOLO 物体検出 |
