# Technical Decisions (ADR)

> Finalized decisions. AI must NOT change or question these.

## 1. Data Strategy
- **Vocabulary**: Single centralized file `oxford_classified.json` (5000 words). Do NOT split.
- **User Data Routes**: All user collections (`wordProgress`, `stats`, `settings`, etc.) go through a single Generic CRUD route `userData.js`.
- **Database**: JSON files as DB. No SQL/NoSQL at this stage.

## 2. State Boundaries
- **Server data** → React Query. Never copy into Zustand.
- **Client state** (auth, theme) → Zustand with persist middleware.
- **Local state** → `useState` inside component.
