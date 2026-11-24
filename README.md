# MangaShelf

**A personal digital manga bookshelf and reading tracker.**

MangaShelf is an interactive digital bookshelf that allows users to organize their manga collection, track reading progress by volume, and customize how their library is displayed. It integrates with the AniList GraphQL API to import manga collections and synchronize supported reading updates.

The project focuses on combining practical collection-management features with a visual bookshelf interface.

## Preview

<!-- Add a screenshot or GIF of the application here.
     Example: <img src="docs/images/mangashelf-preview.png" alt="MangaShelf preview" width="100%">
-->

## Features

| Feature | Description |
| --- | --- |
| **Manga Discovery** | Search the AniList catalogue and add manga to your personal collection. |
| **Interactive Bookshelf** | Display your collection in a shelf-based layout with draggable book ordering. |
| **Dual Display Modes** | Switch between full-cover artwork and stylized book-spine views. |
| **Reading Tracker** | Organize manga using Reading, Finished, Want to Read, and On Hold statuses. |
| **Volume Management** | Track owned volumes and read volumes independently. |
| **Collection Filtering** | Filter manga by genre and reading status, with category and status counts. |
| **Sorting** | Sort by recently updated, title, spine color, or custom order. |
| **AniList Integration** | Authenticate with AniList, import your manga list, and synchronize supported status and progress updates. |
| **Local Persistence** | Keep your collection and shelf preferences between browser sessions using localStorage. |

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | Component-based user interface |
| TypeScript | Static typing and maintainable code |
| Tailwind CSS v4 | Utility-first styling with tailwindcss-animate |
| Vite 8 | Development server and production bundling with React Compiler |
| Motion (v14) | Accessible hardware-accelerated animations and spring physics |
| @dnd-kit | Accessible drag-and-drop shelf reordering |
| @floating-ui/react | Precision tooltip and hover card positioning |
| AniList GraphQL API | Manga metadata and reading list integration |
| Oxlint | JavaScript and TypeScript linting |

## Technical Highlights

- **Component-based architecture:** UI components are organized by feature, separating bookshelf, book details, authentication, and layout responsibilities.
- **Custom React hooks:** Application logic is separated into hooks for collection persistence, AniList authentication, and filtering/sorting.
- **API integration:** AniList GraphQL queries and mutations handle manga discovery, user-list retrieval, and supported list updates.
- **Data persistence and migration:** A versioned storage format validates saved collection data and supports migration from older storage formats.
- **Reusable utilities:** Filtering, sorting, status mapping, and spine presentation logic are kept outside the UI components.
- **Drag-and-drop organization:** Sortable interactions allow users to customize the order of books on their shelf.

## Project Structure

```text
bookshelf-reading-tracker/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication modals & OAuth handlers
│   │   ├── book/          # Book covers, spines, detail modal, and volume picker
│   │   ├── bookshelf/     # Shelf grid, bookcase frame, tiers, and hover cards
│   │   ├── layout/        # Header, status filters, and dropdowns
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
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .oxlintrc.json
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

The repository includes tests for AniList authentication behavior, filtering and sorting utilities, and spine-related utilities.

Before submitting changes, run:

```bash
npm run lint
npm test
npm run build
```

## Future Improvements

- Collection export and import for backup and recovery.
- Cross-device synchronization for locally managed collection data.
- Expanded automated tests for major user workflows.
- Improved accessibility and keyboard support.
- More robust offline and API error handling.

---

<div align="center">

**MangaShelf** — Your manga collection, organized on one shelf.

</div>
