# Writebook MVP (Firebase + Next.js)

This folder contains the Firebase-backed rewrite of Writebook. Researchers can sign up, write Markdown papers, import existing work via DOI, publish to clean `/papers/{slug}` URLs, and talk with readers through nested comments.

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **Firebase Auth** for email/password sign-in
- **Cloud Firestore** for users, books, leaves, comments
- **Firebase Storage** for cover uploads
- **React Markdown + remark-gfm** for editor/reader parity

## Local setup

1. Define project-specific Firebase config inside `ComfyShare-v2/firebase.json` under `projectEnvironments`. Each Firebase project you target (prod, staging, etc.) should have the full `NEXT_PUBLIC_FIREBASE_*` block so the sync script knows what to write. The sample entry ships with placeholder values—replace them with real config from the Firebase console (these are safe to commit; they’re already public in client code).

2. Generate `.env.local` from that mapping (can be rerun anytime). Pass `-- --project <alias-or-id>` if you want a non-default Firebase project:

   ```bash
   npm run sync-env                # default project defined in .firebaserc
   npm run sync-env -- --project staging
   ```

   When you deploy/build, `npm run build` automatically runs `npm run sync-env -- --out .env.production` so the export step always matches the selected Firebase project.

3. Install dependencies:

   ```bash
   npm install
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   The app is available at `http://localhost:5555`.

## Firebase resources required

Before logging in, make sure the Firebase project has:

- Firebase Auth (email/password provider enabled)
- Cloud Firestore with the `writebook_*` collections from `../FIREBASE_SCHEMA.md`
- Firebase Storage with the default security rules already checked into `../storage/storage.rules`

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing hero explaining the mission |
| `/signup`, `/signin` | Auth flows (email + password) |
| `/dashboard` | List of all papers + stats + comment counts |
| `/papers/new` | Blank paper creation |
| `/papers/import` | DOI importer (Crossref/DataCite) |
| `/papers/[bookId]/edit` | Markdown editor, cover upload, publish toggle |
| `/papers/[slug]` | Public reading experience + comments + replies |
| `/settings` | Update name/email/password |

## Feature highlights

- Markdown editor with preview, reorderable sections, cover uploads
- Publish/unpublish plus slug generation with collision checks
- DOI import bootstraps title/authors/abstract into a draft book
- Public reader page mirrors the legacy Rails look and drops shareable link copy button
- Comment threads (1 level of replies), edit/delete, author badge on comments by the book owner
- Dashboard metrics (draft/published counts, total comment counts) and quick links to edit/publish

## Testing / linting

```bash
npm run lint   # Next lint (ESLint)
npm run dev    # Launch dev server with hot reload
```

For full parity with Firebase rules, deploy the security rules in `../firestore/firestore.rules` and `../storage/storage.rules`.
