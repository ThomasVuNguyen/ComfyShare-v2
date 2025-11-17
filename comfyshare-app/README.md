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

2. Generate `.env.local` from that mapping whenever you need it (optional convenience for local dev). Pass `-- --project <alias-or-id>` if you want a non-default Firebase project:

   ```bash
   npm run sync-env                # default project defined in .firebaserc
   npm run sync-env -- --project staging
   ```

   Alternatively, copy `.env.example` and edit it manually. App Hosting deploys don’t run this script; they rely on the environment variables declared in `apphosting.yaml`.

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
| `/dashboard/papers/[bookId]/edit` | Markdown editor, cover upload, publish toggle |
| `/papers/[slug]` | Public reading experience + comments + replies |
| `/settings` | Update name/email/password |

## Feature highlights

- Markdown editor with preview, reorderable sections, cover uploads
- Publish/unpublish plus slug generation with collision checks
- DOI import bootstraps title/authors/abstract into a draft book
- Public reader page mirrors the legacy Rails look and drops shareable link copy button
- Comment threads (1 level of replies), edit/delete, author badge on comments by the book owner
- Dashboard metrics (draft/published counts, total comment counts) and quick links to edit/publish

## App Hosting / environment

If you deploy with Firebase App Hosting, use `apphosting.yaml` to describe the Cloud Run settings (min/max instances, CPU/memory, concurrency) and list the environment variables that App Hosting should pull from Secret Manager. We've pre-populated it with the `NEXT_PUBLIC_FIREBASE_*` vars to keep the runtime config in sync.

## Deployment

### Manual Cloud Run Deployment (Gen2)

Due to container threat detection requirements, this project must use the gen2 execution environment. Firebase App Hosting doesn't support gen2 configuration yet, so we deploy manually:

1. **Build via Firebase** (builds the container but deployment will fail):
   ```bash
   firebase deploy --only apphosting:comfyshare --project=starmind-72daa
   ```

2. **Note the build tag** from the error message (e.g., `build-2025-11-17-003`)

3. **Deploy to Cloud Run with gen2**:
   ```bash
   gcloud run deploy comfyshare \
     --image=us-central1-docker.pkg.dev/starmind-72daa/firebaseapphosting-images/comfyshare:BUILD_TAG_HERE \
     --region=us-central1 \
     --project=starmind-72daa \
     --execution-environment=gen2 \
     --allow-unauthenticated \
     --set-env-vars="NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAw7sgwP4Q5cxz8z7N4Y8g5_BB7hdgzWG8,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=starmind-72daa.firebaseapp.com,NEXT_PUBLIC_FIREBASE_PROJECT_ID=starmind-72daa,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=starmind-72daa.firebasestorage.app,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=372397827204,NEXT_PUBLIC_FIREBASE_APP_ID=1:372397827204:web:b3ba2cc01dde9abcee8ed1"
   ```

**Live URL**: https://comfyshare-372397827204.us-central1.run.app

## Testing / linting

```bash
npm run lint   # Next lint (ESLint)
npm run dev    # Launch dev server with hot reload
```

For full parity with Firebase rules, deploy the security rules in `../firestore/firestore.rules` and `../storage/storage.rules`.
