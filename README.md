# 📚 3D Manga Bookshelf & Reading Tracker

A visually immersive, interactive 3D digital bookshelf and manga reading tracker built with **React 19**, **TypeScript**, and **Tailwind CSS v4**, featuring full bi-directional synchronization with **AniList**.

---

## ✨ Features

- **Realistic 3D Recessed Bookshelf**:
  - Isometric depth, realistic wood grain textures, dynamic lighting, and shelf shadows.
  - Responsive multi-shelf layout that adapts dynamically to your screen size.
- **Dual Display Modes**:
  - **Spine Mode**: Procedurally styled manga book spines featuring dynamic color palettes derived from genres/titles, authentic Japanese volume badges, stylized typography, and publisher marks.
  - **Cover Mode**: High-resolution cover artwork with 3D perspective tilts, realistic depth shadows, and interactive hover elevation.
- **Bi-Directional AniList Sync**:
  - Authenticate via AniList OAuth2 (supports token login and direct authorization redirect).
  - One-click import for all manga lists (`CURRENT`, `COMPLETED`, `PAUSED`, `DROPPED`, `PLANNING`).
  - Update reading progress (chapters and volumes) directly from the shelf, syncing mutations back to AniList in real time.
- **Volume-Level Tracking**:
  - Interactive **Volume Picker Modal** allowing you to place specific individual volumes of a series onto your physical shelves.
  - Track owned vs. read volumes per series.
- **Live Search & Auto-Suggest**:
  - Instant debounced search querying the AniList GraphQL API directly.
  - Add series directly to your bookshelf with pre-filled metadata, genres, and artwork.
- **Drag-and-Drop Shelf Reordering**:
  - Rearrange books freely across different shelf tiers and positions using native HTML5 drag-and-drop.
- **Sorting & Filtering**:
  - Filter by reading status or genre categories.
  - Sort by Title (A-Z / Z-A), Score / Rating, Progress, or Date Added.
- **Local Persistence & Offline First**:
  - Automatic synchronization to `localStorage` ensures your custom shelf order and metadata persist without internet connectivity.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Core UI library utilizing modern hooks and concurrent rendering |
| **React Compiler** | Experimental zero-runtime memoization compiler (`babel-plugin-react-compiler`) |
| **TypeScript (Strict)** | Static typing with strict null checks and full type safety |
| **Tailwind CSS v4** | Next-generation utility-first styling engine with CSS variables |
| **Vite 8** | Ultra-fast development server and optimized ES module bundler |
| **AniList GraphQL API** | Real-time manga search, metadata fetching, and user list mutations |
| **Oxlint** | High-performance Rust-based JavaScript/TypeScript linter |

---

## 📁 Project Structure

```text
BookShelf/
├── src/
│   ├── components/
│   │   ├── auth/           # AniList OAuth authentication modal
│   │   ├── book/           # 3D BookCover, BookSpine, DetailModal, and VolumePicker
│   │   ├── bookshelf/      # 3D wooden shelf container and slot rendering
│   │   ├── layout/         # Header, CategoryDropdown, SortDropdown, StatusBar
│   │   ├── manga/          # Debounced live AniList search bar
│   │   └── EmptyState.tsx  # Empty shelf placeholder component
│   ├── hooks/
│   │   ├── useAniListAuth.ts       # OAuth state, token persistence, login/logout
│   │   └── useBookshelfStorage.ts  # LocalStorage persistence and shelf state
│   ├── services/
│   │   ├── anilist.ts       # Core GraphQL queries, mutations, and search logic
│   │   ├── anilistAuth.ts   # OAuth URL generation, token validation, user profile
│   │   └── anilistClient.ts # Fetch wrapper with rate-limit handling and token headers
│   ├── types/
│   │   └── book.ts          # Core TypeScript interfaces (Book, Volume, ShelfDisplayMode)
│   ├── utils/
│   │   └── spineUtils.ts    # Procedural spine palette generation, badge algorithms
│   ├── App.tsx              # Main application orchestrator
│   ├── index.css            # Tailwind CSS v4 setup and custom 3D transform utilities
│   └── main.tsx             # React DOM root entry
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** (or **pnpm** / **yarn**)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/bastianjsx/BookShelf.git
   cd BookShelf
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## ⚙️ AniList OAuth Configuration (Optional)

By default, users can paste their personal access token or authenticate via AniList OAuth. If you want to host your own AniList API client:

1. Register an application at [AniList Developer Settings](https://anilist.co/settings/developer).
2. Set the **Redirect URL** to your deployment domain (e.g., `http://localhost:5173` for development).
3. Update the `CLIENT_ID` in [`src/services/anilistAuth.ts`](src/services/anilistAuth.ts).

---

## 📜 Available Scripts

- **`npm run dev`**: Launches Vite dev server with Hot Module Replacement (HMR).
- **`npm run build`**: Runs TypeScript compilation (`tsc -b`) and produces an optimized production build in `dist/`.
- **`npm run lint`**: Runs `oxlint` across all TypeScript and React components for instant linting.
- **`npm run preview`**: Serves the local production build for testing.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
