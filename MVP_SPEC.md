# Writebook MVP - Feature Spec

> **Mission:** Instant, free academic publishing with direct reader engagement via comments.

---

## CORE FLOW

```
Sign up → Write OR Import (DOI) → Publish → Get shareable link →
Share → Read → Comment → Dashboard
```

**No search. No discovery. Papers shared via direct links only.**

---

## FEATURES

### 1. Authentication
- Email/password sign up/sign in
- Basic profile (name, email)

### 2. Write Paper
**Option A: Write New**
- Title + subtitle
- Multiple pages/sections
- Markdown editor (same as Rails app)
- Drag-drop reorder pages
- Save draft
- Publish button → get shareable link

**Option B: Import from DOI**
- Enter DOI
- Fetch metadata (title, authors, abstract)
- Auto-create structure
- Edit before publishing
- Publish → get shareable link

### 3. Read Paper
- Public URL: `/papers/{slug}`
- Clean, minimal layout (match Rails app)
- Markdown rendering
- Code syntax highlighting
- Math equations (if needed)
- Table of contents sidebar
- Light/dark mode
- Open Graph meta tags for social sharing

### 4. Comments
- Comment on entire paper (not per-page)
- Plain text, max 2000 chars
- Nested replies (1 level only)
- Author badge on paper author's comments
- Edit own comment (mark as "edited")
- Delete own comment (soft delete)
- Author can delete any comment on their paper
- Chronological display (newest first)

### 5. Dashboard
- List all papers (draft + published)
- Show: Title, status, comment count, dates
- Actions: Edit, View, Delete, Copy link
- View all comments on paper
- Reply to comments
- Basic stats (total papers, total comments)
- Settings (edit name/email/password)

---

## SCHEMA

### Firestore Collections

```
/writebook_users/{userId}
  userId: string
  name: string
  email: string
  createdAt: Timestamp

/writebook_books/{bookId}
  bookId: string
  title: string
  subtitle?: string
  author: string
  slug: string (unique, URL-friendly)
  published: boolean
  createdBy: string (userId)
  createdAt: Timestamp
  updatedAt: Timestamp

/writebook_books/{bookId}/leaves/{leafId}
  leafId: string
  bookId: string
  type: 'page'
  title: string
  body: {
    content: string (markdown)
  }
  positionScore: number (for ordering, 0.0-1.0)
  createdAt: Timestamp
  updatedAt: Timestamp

/writebook_books/{bookId}/comments/{commentId}
  commentId: string
  bookId: string
  userId: string
  userName: string (cached)
  text: string (max 2000)
  parentCommentId?: string (for replies)
  depth: number (0 = top-level, 1 = reply)
  edited: boolean
  deleted: boolean (soft delete)
  createdAt: Timestamp
  updatedAt: Timestamp
```

### Security Rules Summary

```javascript
- Anyone can read published books & comments
- Authenticated users can create books & comments
- Users can update/delete own books & comments
- Book creators can delete any comment on their papers
```

---

## TECH STACK

- **Frontend:** Next.js 14 + React + TypeScript
- **UI:** shadcn/ui + Tailwind (styled to match Rails app)
- **Backend:** Firebase (Auth, Firestore, Hosting)
- **Analytics:** PostHog
- **Markdown:** react-markdown + remark-gfm
- **Code Highlighting:** Prism.js
- **Math:** KaTeX (if needed)

---

## USER FLOWS

### Flow 1: Write & Publish
1. Sign in → Dashboard
2. Click "New Paper"
3. Enter title/subtitle
4. Add pages, write content
5. Save draft
6. Click "Publish"
7. Get shareable link
8. Copy & share on Twitter/email

**Target: <10 minutes**

### Flow 2: Import & Publish
1. Sign in → Dashboard
2. Click "Import from DOI"
3. Enter DOI (e.g., `10.1101/2024.01.001`)
4. System fetches metadata
5. Preview & edit
6. Click "Publish"
7. Get shareable link
8. Share

**Target: <2 minutes**

### Flow 3: Read & Comment
1. Click shareable link (no auth needed)
2. Read paper
3. Scroll to comments
4. Click "Sign in to comment"
5. Sign up/sign in
6. Write comment & submit
7. (Optional) Reply to others

### Flow 4: Manage Comments
1. Sign in → Dashboard
2. See comment count on papers
3. Click paper → view all comments
4. Reply or moderate (delete)

---

## ROUTES

```
/                     → Landing page (or redirect to /dashboard if signed in)
/signup               → Sign up form
/signin               → Sign in form
/dashboard            → User dashboard (list papers)
/papers/new           → Create new paper
/papers/import        → Import from DOI
/papers/{slug}/edit   → Edit paper (draft or published)
/papers/{slug}        → Public paper view + comments
/settings             → User settings
```

---

## COMPONENTS

### Core Components
- `AuthForm` - Sign up/sign in
- `PaperEditor` - Markdown editor (match Rails app)
- `PaperList` - Dashboard paper list
- `PaperView` - Public reading view
- `CommentForm` - Write/edit comment
- `CommentList` - Display comments with threading
- `CommentItem` - Single comment with replies
- `ShareButton` - Copy shareable link

### UI Components (shadcn/ui)
- Button, Input, Textarea
- Card, Dialog, Toast
- Avatar, Badge
- Loading spinner

---

## CLOUD FUNCTIONS

### Required
1. `writebook_onUserCreate` - Create user profile on signup

### Optional (if time)
2. `writebook_onCommentCreate` - Email notification to paper author

---

## NOT BUILDING (MVP)

- ❌ Search/Algolia
- ❌ Homepage with paper list
- ❌ Browse/discovery features
- ❌ Image uploads
- ❌ Version history
- ❌ Multiple authors
- ❌ Collaboration
- ❌ PDF export
- ❌ Inline comments
- ❌ Upvote/downvote
- ❌ Email notifications (maybe add in week 4)
- ❌ Real-time updates

---

## SUCCESS CRITERIA

### Launch Week
- ✅ 5 beta users
- ✅ 3 published papers
- ✅ 5+ comments
- ✅ All shareable links work
- ✅ Mobile responsive
- ✅ Lighthouse > 85

### Month 1
- ✅ 25 users
- ✅ 15 papers
- ✅ 50+ comments
- ✅ Average <24h signup→publish
- ✅ 1+ paper shared on Twitter

---

## TIMELINE

**Week 1:** Auth + Write + DOI import
**Week 2:** Publish + Beautiful reading
**Week 3:** Comments system
**Week 4:** Dashboard + Polish + Launch

**Total: 4 weeks to ship**

---

## OPEN QUESTIONS

1. **Rails editor?** Which Markdown editor library does Rails app use?
2. **DOI method?** What API/service for DOI import? Code/pseudocode?
3. **Math rendering?** Does Rails app support equations? Which library?
4. **Must-have features?** Any critical reading features from Rails app?

---

## METRICS TO TRACK

**PostHog Events:**
- Sign up
- Paper published (manual vs DOI)
- Paper viewed
- Comment posted
- Reply posted
- Shareable link copied

**North Star Metric:**
- Time from signup → first shareable link (target: <30 min)

---

## LAUNCH CHECKLIST

- [ ] Can write paper in <10 min
- [ ] Can import DOI in <2 min
- [ ] Papers look professional (match Rails)
- [ ] Comments work smoothly
- [ ] Dashboard functional
- [ ] Shareable links work (Twitter preview)
- [ ] Mobile works (iOS + Android)
- [ ] Performance good (Lighthouse >85)
- [ ] No critical bugs

**Then ship! 🚀**
