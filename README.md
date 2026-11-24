# MangaShelf

**A personal digital manga bookshelf and reading tracker.**

MangaShelf is an interactive digital bookshelf that allows users to organize their manga collection, track reading progress by volume, and customize how their library is displayed. It integrates with the AniList GraphQL API to import manga collections and synchronize supported reading updates.

The project focuses on combining practical collection-management features with a visual bookshelf interface.

[![Live Demo](https://img.shields.io/badge/Visit-Live_Demo-2EA44F?style=for-the-badge&logo=vercel&logoColor=white)](https://manga-shelf-bas.vercel.app/)

## Features

| Feature | Description |
| --- | --- |
| **Manga Discovery** | Search the AniList catalogue and add manga to your personal collection. |
| **Interactive Bookshelf** | Display your collection in a 4-shelf-per-page bookcase with responsive row fitting, page navigation, and draggable book ordering. |
| **Dual Display Modes** | Switch between full-cover artwork and realistic stylized book-spine views. |
| **Reading Tracker** | Organize manga using Reading, Finished, Want to Read, and On Hold statuses with reading progress bars. |
| **Volume Management** | Track owned volumes and read volumes independently via an interactive volume picker modal. |
| **Collection Filtering** | Filter manga by genre and reading status, with real-time category and status count badges. |
| **Sorting** | Sort by recently updated, title (A-Z / Z-A), spine color, or custom drag-and-drop order. |
| **AniList Integration** | Authenticate with AniList, import your manga list, and synchronize supported status and progress updates with debounced queueing. |
| **Local Persistence & Multi-Tab** | Persist your collection and preferences in `localStorage` with automated schema migrations and cross-tab synchronization. |

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | Component-based user interface |
| TypeScript | Static typing and maintainable code |
| Tailwind CSS v4 | Utility-first styling with `@tailwindcss/vite` and `tailwindcss-animate` |
| Vite 8 | Development server and production bundling |
| Motion (v14) | Accessible hardware-accelerated animations and spring physics |
| @dnd-kit | Accessible drag-and-drop shelf reordering |
| @floating-ui/react | Precision tooltip and hover card positioning |
| AniList GraphQL API | Manga metadata and reading list integration |
| Oxlint | High-performance JavaScript and TypeScript linter |

## Technical Highlights

- **Component-Based Architecture:** UI components are organized cleanly by domain: bookshelf tiers, book covers and spines, modals, search, and layout controls.
- **Custom React Hooks:** Core business logic is isolated into dedicated hooks for storage management, AniList authentication, modal lifecycle/focus trapping, and filter/sort handling.
- **Optimistic Sync Queue:** Rapid user interactions (e.g. button clicking or slider changes) are debounced and coalesced using an asynchronous `SyncQueue` that merges pending mutations into single API calls.
- **Modal Lifecycle & Accessibility:** Shared `useModalDialog` hook provides unified body scroll locking without layout shift, `Escape` key handling, `aria-modal` compliance, and focus trap with previous-focus restoration.
- **Data Persistence & Versioned Migrations:** A versioned envelope format validates storage data, isolates corrupted entries to prevent data loss, and supports automated migrations across schema versions.
- **Responsive 3D Bookshelf:** Shelves dynamically recalculate book and spine capacity per tier using `ResizeObserver`, distributing volumes cleanly across a 4-shelf pagination system.

## Project Structure

```text
bookshelf-reading-tracker/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication modals & OAuth handlers
│   │   ├── book/          # Book covers, spines, detail modal, and volume picker
│   │   ├── bookshelf/     # Shelf grid, bookcase frame, tiers, and hover cards
│   │   ├── layout/        # Header, status filters, category and sort dropdowns
│   │   ├── manga/         # AniList search bar and result list
│   │   └── EmptyState.tsx # Empty bookshelf & filter match states
│   │
│   ├── hooks/
│   │   ├── useAniListAuth.ts
│   │   ├── useBookshelfFilterSort.ts
│   │   ├── useBookshelfStorage.ts
│   │   ├── useDismiss.ts
│   │   └── useModalDialog.ts
│   │
│   ├── services/
│   │   ├── anilist.ts
│   │   ├── anilistAuth.ts
│   │   └── anilistClient.ts
│   │
│   ├── types/
│   │   └── book.ts
│   │
│   ├── utils/
│   │   ├── filterSortUtils.ts
│   │   ├── spineUtils.ts
│   │   ├── statusConfig.ts
│   │   ├── storageValidation.ts
│   │   └── syncQueue.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── .env.example
├── .gitignore
├── .oxlintrc.json
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js >= 22.18.0 (required for `npm test` with native TypeScript type stripping)
- npm >= 10.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/bastianjsx/MangaShelf.git

# Navigate to the project
cd MangaShelf

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open the local URL printed by Vite in your terminal.

### Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Run TypeScript checks and build the application |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run Oxlint |
| `npm test` | Run the Node.js test suite |

## AniList Integration

MangaShelf uses the [AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs/) to retrieve manga metadata and interact with a user's manga list.

To connect an account:

1. Open the AniList login option in the application.
2. Provide or configure an AniList OAuth Client ID.
3. Complete the AniList authorization flow.
4. Return to MangaShelf to retrieve and synchronize your manga list.

For a custom deployment, configure an AniList OAuth application and ensure its redirect settings match the deployed application URL. The application also supports direct token submission through its login interface.

## Data & Synchronization Notes

- The personal collection and display preferences are stored in browser `localStorage`.
- AniList provides catalogue information and the connected user's manga-list data.
- Supported reading-status and progress changes can be synchronized with AniList.
- Locally managed information, such as owned volumes and shelf presentation preferences, is maintained separately from AniList data.
- Local browser storage does not automatically synchronize between devices.

## Testing

Run the test suite:

```bash
npm test
```

The repository includes 30 unit tests across 7 test suites covering:
- **AniList Authentication & Sync:** Token parsing, auto-sync intervals, and auth-cleared broadcasting.
- **Storage Reconciliation & Migrations:** Multi-format migration (v1 to v2) and remote-to-local conflict resolution.
- **Optimistic Mutation Queue (`SyncQueue`):** Debouncing, payload coalescing, and error rollback.
- **Error Dismissal Logic:** Safe dismissal lifecycle preventing permanent error suppression.
- **Filtering & Sorting:** Multi-category filtering, status counting, and title/recent sorting.
- **Spine Calculations:** Deterministic bookstore palette mapping and boundary safety.

Before submitting changes, run:

```bash
npm run lint
npm test
npm run build
```
