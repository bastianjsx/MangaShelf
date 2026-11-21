# MangaShelf

**A personal digital manga bookshelf and reading tracker.**

MangaShelf is an interactive digital bookshelf that allows users to organize their manga collection, track reading progress, and customize how their library is displayed. It integrates with the AniList GraphQL API to import manga collections and synchronize supported reading updates.

## Features

### Interactive Digital Bookshelf
- Realistic 3D-inspired wooden bookshelf design.
- Responsive multi-shelf layout.
- Two display modes:
  - **Cover Mode:** Display manga using their cover artwork.
  - **Spine Mode:** Display procedurally styled manga spines with dynamic colors, typography, and volume badges.
- Interactive book selection and detail views.

### Manga Collection Management
- Search and discover manga through the AniList API.
- Add manga with automatically populated metadata and cover artwork.
- View manga information, including titles, authors, genres, and descriptions.
- Remove manga from your personal bookshelf.
- Organize manga using drag-and-drop functionality.

### Reading Progress Tracking
- Track reading status:
  - Reading
  - Finished
  - Want to Read
  - On Hold
- Track owned and read manga volumes individually.
- Update reading progress by chapters and volumes.
- View collection statistics based on reading status.

### AniList Integration
- Authenticate through AniList OAuth or a personal access token.
- Import manga collections from AniList.
- Support AniList reading lists:
  - Current
  - Completed
  - Paused
  - Dropped
  - Planning
- Synchronize supported reading status and progress updates with AniList.

### Organization and Customization
- Filter manga by reading status and genres.
- Sort collections by:
  - Title (A–Z)
  - Title (Z–A)
  - Recently Added
  - Spine Color
  - Custom Order
- Rearrange manga across the bookshelf.
- Persist display preferences and collection data locally.

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | Component-based user interface |
| TypeScript | Static typing and maintainable code |
| Tailwind CSS v4 | Utility-first styling |
| Vite 8 | Development server and production bundling |
| AniList GraphQL API | Manga metadata and reading list integration |
| Oxlint | JavaScript and TypeScript linting |

## Project Structure

```text
MangaShelf/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── book/          # Book covers, spines, and modals
│   │   ├── bookshelf/     # Bookshelf rendering components
│   │   ├── layout/        # Header and layout components
│   │   └── manga/         # Manga search components
│   │
│   ├── hooks/
│   │   ├── useAniListAuth.ts
│   │   └── useBookshelfStorage.ts
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
│   │   └── spineUtils.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── .oxlintrc.json
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js 20.19+ or 22.12+
- npm
- Git

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/bastianjsx/MangaShelf.git
```

**2. Navigate to the project directory**

```bash
cd MangaShelf
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

**5. Open the application**

Navigate to:

```text
http://localhost:5173
```

## AniList Configuration

MangaShelf integrates with the AniList GraphQL API to retrieve manga information and synchronize supported reading updates.

### Option 1: Personal Access Token

1. Open [AniList](https://anilist.co/).
2. Obtain your personal access token.
3. Open MangaShelf.
4. Select the AniList login option.
5. Enter your access token.

### Option 2: AniList OAuth

1. Visit [AniList Developer Settings](https://anilist.co/settings/developer).
2. Register an application.
3. Configure the redirect URL to match your local development address:

```text
http://localhost:5173
```

4. Create a `.env.local` file in the project root:

```env
VITE_ANILIST_CLIENT_ID=your_client_id
```

5. Restart the development server.

**Note:** The OAuth client ID is public configuration, not a client secret. Never expose private credentials or personal access tokens in your source code or public repository.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Run TypeScript project checks and create a production build |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview the production build locally |

## Data Storage

MangaShelf currently uses browser `localStorage` to persist:

- Manga collection data.
- Owned and read volume information.
- Bookshelf display preferences.
- Sorting preferences.
- AniList authentication information.

Local bookshelf data is stored within the browser and is not automatically shared between different devices.

AniList synchronization is used for supported remote manga list information and reading updates.