# DOI Paper Extraction - PREreview.org Method

> Documentation of how PREreview.org extracts paper metadata from DOI using multiple APIs

**Source:** `/home/ubuntu/clone/prereview.org/src/`

---

## OVERVIEW

PREreview.org uses **three main APIs** to fetch paper metadata from DOI:

1. **CrossRef API** - Most academic papers
2. **DataCite API** - Research data, datasets, preprints
3. **Japan Link Center API** - Japanese academic content

They use a **fallback strategy**: Try one API, if it fails or doesn't support the DOI, try another.

---

## ARCHITECTURE

### Flow Diagram

```
DOI Input
    ↓
Parse & Validate DOI
    ↓
Determine Publisher (from DOI prefix)
    ↓
Select Appropriate API
    ↓
    ├──→ CrossRef API (10.1101, 10.31234, etc.)
    ├──→ DataCite API (10.5281, 10.17605, etc.)
    └──→ Japan Link Center API (Japanese content)
    ↓
Fetch Metadata
    ↓
Parse Response
    ↓
Transform to Unified Format
    ↓
Return Preprint Object
```

---

## 1. CROSSREF API INTEGRATION

### API Endpoint
```
https://api.crossref.org/works/{DOI}
```

### Request Example

**File:** `src/ExternalApis/Crossref/GetWork/CreateRequest.ts`

```typescript
export const CreateRequest = (doi: Doi.Doi) =>
  HttpClientRequest.get(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)
```

**Example:**
```bash
GET https://api.crossref.org/works/10.1101/2024.01.001
```

### Response Structure

**File:** `src/ExternalApis/Crossref/Work.ts`

CrossRef returns a JSON response with this structure:

```typescript
{
  message: {
    DOI: string,
    resource: {
      primary: {
        URL: string
      }
    },
    title: string[],
    abstract?: string,
    author: Array<{
      ORCID?: string,
      given?: string,
      family: string,
      name?: string
    }>,
    institution?: Array<{
      name: string
    }>,
    published: {
      'date-parts': [[year, month?, day?]]
    },
    'group-title'?: string,
    type: string,
    subtype?: string
  }
}
```

### Data Extracted

**File:** `src/Preprints/Crossref/Preprint.ts`

They extract:
- **DOI** - Unique identifier
- **Title** - Paper title (from title array)
- **Authors** - List of authors with names and ORCID IDs
- **Abstract** - Paper abstract (JATS XML transformed to HTML)
- **Publication Date** - Posted date
- **URL** - Link to paper
- **Type & Subtype** - Must be `posted-content` + `preprint`

### Transformation Example

```typescript
export const workToPreprint = (work: Crossref.Work) => {
  // Validate it's a preprint
  if (work.type !== 'posted-content' || work.subtype !== 'preprint') {
    return Error('Not a preprint')
  }

  // Extract authors
  const authors = work.author.map(author => {
    if (author.given && author.family) {
      return {
        name: `${author.given} ${author.family}`,
        orcid: author.ORCID
      }
    }
    return { name: author.family || author.name }
  })

  // Extract title
  const title = {
    text: sanitizeHtml(work.title[0]),
    language: detectLanguage(work.title[0])
  }

  // Extract abstract (if exists)
  const abstract = work.abstract ? {
    text: transformJatsToHtml(work.abstract),
    language: detectLanguage(work.abstract)
  } : undefined

  // Return unified format
  return {
    id: determinePreprintId(work.DOI),
    authors,
    title,
    abstract,
    posted: work.published,
    url: work.resource.primary.URL
  }
}
```

### Supported Publishers (CrossRef)

Based on DOI prefix (registrant):
- `10.1101` - bioRxiv, medRxiv
- `10.31234` - PsyArXiv
- `10.31730` - AfricArXiv
- `10.35542` - EdArXiv
- `10.12688` - Gates Foundation
- Many more (see `PreprintId.ts` for full list)

---

## 2. DATACITE API INTEGRATION

### API Endpoint
```
https://api.datacite.org/dois/{DOI}
```

### Request Example

**File:** `src/ExternalApis/Datacite/GetRecord/CreateRequest.ts`

```typescript
export const CreateRequest = (doi: Doi.Doi) =>
  HttpClientRequest.get(`https://api.datacite.org/dois/${encodeURIComponent(doi)}`)
```

**Example:**
```bash
GET https://api.datacite.org/dois/10.5281/zenodo.1234567
```

### Response Structure

**File:** `src/ExternalApis/Datacite/Record.ts`

DataCite uses a different schema:

```typescript
{
  data: {
    attributes: {
      doi: string,
      creators: Array<{
        givenName?: string,
        familyName?: string,
        name?: string,
        nameIdentifiers?: Array<{
          nameIdentifier: string,
          nameIdentifierScheme: string  // 'ORCID'
        }>
      }>,
      titles: Array<{
        title: string
      }>,
      publisher: string,
      dates: Array<{
        date: string,  // ISO date or year
        dateType: string  // 'Submitted', 'Created', 'Issued'
      }>,
      types: {
        resourceType?: string,
        resourceTypeGeneral?: string
      },
      relatedIdentifiers: Array<{
        relationType: string,
        relatedIdentifier: string
      }>,
      descriptions: Array<{
        description: string,
        descriptionType: string  // 'Abstract'
      }>,
      url: string
    },
    relationships: {
      provider: {
        data: {
          id: string
        }
      }
    }
  }
}
```

### Data Extracted

**File:** `src/Preprints/Datacite/Preprint.ts`

They extract:
- **DOI** - From `doi` field
- **Title** - From `titles[0].title`
- **Authors** - From `creators` array
- **Abstract** - From `descriptions` where `descriptionType === 'Abstract'`
- **Publication Date** - From `dates` (priority: Submitted > Created > Issued)
- **URL** - From `url` field
- **Type** - Must be `resourceType: 'preprint'` or `resourceTypeGeneral: 'preprint'`

### Finding Publication Date

```typescript
const findPublishedDate = (dates: Array<{date: string, dateType: string}>) => {
  // Priority order
  const submitted = dates.find(d => d.dateType === 'Submitted')
  if (submitted) return submitted.date

  const created = dates.find(d => d.dateType === 'Created')
  if (created) return created.date

  const issued = dates.find(d => d.dateType === 'Issued')
  if (issued) return issued.date

  return null
}
```

### Supported Publishers (DataCite)

Based on DOI prefix:
- `10.5281` - Zenodo, AfricArXiv (Zenodo)
- `10.17605` - OSF Preprints, Lifecycle Journal
- `10.6084` - AfricArXiv (Figshare)
- `10.48550` - arXiv
- `10.21203` - Research Square
- And more...

---

## 3. JAPAN LINK CENTER API

### API Endpoint
```
https://api.japanlinkcenter.org/dois/{DOI}
```

### Request Example

**File:** `src/ExternalApis/JapanLinkCenter/Record.ts`

```typescript
export const GetRecord = (doi: Doi.Doi) =>
  HttpClient.get(
    new URL(
      encodeURIComponent(encodeURIComponent(doi)),  // Double encoding!
      'https://api.japanlinkcenter.org/dois/'
    )
  )
```

**Example:**
```bash
GET https://api.japanlinkcenter.org/dois/10.1234%2Fexample
```

### Response Structure

```typescript
{
  status: 'OK',
  data: {
    doi: string,
    url: string,
    content_type: 'JA' | 'BK' | 'RD' | 'EL' | 'GD',
    publication_date: {
      publication_year: string,
      publication_month?: string,
      publication_day?: string
    },
    title_list: Array<{
      lang: 'en' | 'ja',
      title: string,
      subtitle?: string
    }>,
    creator_list: Array<{
      type: 'person',
      names: Array<{
        lang: 'en' | 'ja',
        last_name?: string,
        first_name: string
      }>,
      researcher_id_list?: Array<{
        id_code: string,  // ORCID URL
        type: 'ORCID'
      }>
    }>
  }
}
```

### Data Extracted

- **DOI** - From `doi` field
- **Title** - From `title_list` (prefer English, fallback to Japanese)
- **Authors** - From `creator_list` with ORCID IDs
- **Publication Date** - From `publication_date`
- **URL** - From `url` field
- **Language** - From `title_list[].lang` and `creator_list[].names[].lang`

---

## UNIFIED DATA MODEL

All three APIs transform to this unified structure:

```typescript
interface Preprint {
  id: PreprintId;              // Unique ID (derived from DOI)
  authors: Array<{
    name: string;
    orcid?: string;            // ORCID ID if available
  }>;
  title: {
    text: string;              // HTML-sanitized title
    language: LanguageCode;    // ISO 639-1 code (en, ja, fr, etc.)
  };
  abstract?: {
    text: string;              // HTML-sanitized abstract
    language: LanguageCode;
  };
  posted: PlainDate | PlainYearMonth | number;  // Publication date
  url: URL;                    // Link to paper
}
```

---

## IMPLEMENTATION GUIDE

### Simple Implementation (JavaScript/TypeScript)

```typescript
// 1. Simple CrossRef fetch
async function fetchPaperFromDOI(doi: string) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`)
  }

  const data = await response.json()
  const work = data.message

  return {
    doi: work.DOI,
    title: work.title?.[0] || 'Untitled',
    authors: work.author?.map(a => ({
      name: a.given ? `${a.given} ${a.family}` : a.family,
      orcid: a.ORCID
    })) || [],
    abstract: work.abstract,
    publishedDate: work.published?.['date-parts']?.[0],
    url: work.resource?.primary?.URL
  }
}

// Usage
const paper = await fetchPaperFromDOI('10.1101/2024.01.001')
console.log(paper)
```

### With Fallback (CrossRef → DataCite)

```typescript
async function fetchPaperWithFallback(doi: string) {
  // Try CrossRef first
  try {
    const crossrefUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}`
    const response = await fetch(crossrefUrl)

    if (response.ok) {
      const data = await response.json()
      return transformCrossrefWork(data.message)
    }
  } catch (error) {
    console.log('CrossRef failed, trying DataCite...')
  }

  // Fallback to DataCite
  try {
    const dataciteUrl = `https://api.datacite.org/dois/${encodeURIComponent(doi)}`
    const response = await fetch(dataciteUrl)

    if (response.ok) {
      const data = await response.json()
      return transformDataciteRecord(data.data.attributes)
    }
  } catch (error) {
    console.log('DataCite failed')
  }

  throw new Error('Could not fetch paper from any API')
}

function transformCrossrefWork(work: any) {
  return {
    doi: work.DOI,
    title: work.title?.[0],
    authors: work.author?.map(a => a.given ? `${a.given} ${a.family}` : a.family),
    abstract: work.abstract,
    publishedDate: work.published?.['date-parts']?.[0]?.join('-'),
    url: work.resource?.primary?.URL
  }
}

function transformDataciteRecord(attributes: any) {
  // Find published date (priority: Submitted > Created > Issued)
  const date = attributes.dates?.find(d => d.dateType === 'Submitted')
    || attributes.dates?.find(d => d.dateType === 'Created')
    || attributes.dates?.find(d => d.dateType === 'Issued')

  // Find abstract
  const abstract = attributes.descriptions?.find(d => d.descriptionType === 'Abstract')

  return {
    doi: attributes.doi,
    title: attributes.titles?.[0]?.title,
    authors: attributes.creators?.map(c =>
      c.givenName ? `${c.givenName} ${c.familyName}` : c.name
    ),
    abstract: abstract?.description,
    publishedDate: date?.date,
    url: attributes.url
  }
}
```

### For Firebase Cloud Functions

```typescript
import * as functions from 'firebase-functions'

export const importPaperFromDOI = functions.https.onCall(async (data, context) => {
  const { doi } = data

  // Validate DOI format
  if (!doi || typeof doi !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid DOI')
  }

  // Try CrossRef
  const crossrefUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}`
  const response = await fetch(crossrefUrl)

  if (!response.ok) {
    throw new functions.https.HttpsError('not-found', 'Paper not found')
  }

  const data = await response.json()
  const work = data.message

  // Transform to our format
  return {
    title: work.title?.[0] || 'Untitled',
    authors: work.author?.map(a =>
      a.given ? `${a.given} ${a.family}` : a.family
    ).join(', '),
    abstract: work.abstract,
    publishedDate: work.published?.['date-parts']?.[0],
    url: work.resource?.primary?.URL,
    doi: work.DOI
  }
})
```

---

## KEY FEATURES FROM PREREVIEW.ORG

### 1. DOI Validation
They use the `doi-ts` library to parse and validate DOIs:

```typescript
import * as Doi from 'doi-ts'

// Parse DOI
const doi = Doi.parse('10.1101/2024.01.001')  // Returns Option<Doi>

// Check if valid
const isValid = Doi.isDoi('10.1101/2024.01.001')  // true/false

// Check registrant (publisher)
const isBiorxiv = Doi.hasRegistrant('10.1101')(doi)  // true
```

### 2. HTML Sanitization
They sanitize all HTML content (titles, abstracts):

```typescript
import { sanitizeHtml } from './html'

const title = sanitizeHtml(work.title[0])
const abstract = sanitizeHtml(work.abstract)
```

### 3. Language Detection
They detect the language of title/abstract:

```typescript
import { detectLanguage } from './detect-language'

const language = detectLanguage(title)  // Returns ISO 639-1 code
```

### 4. JATS XML Transformation
CrossRef abstracts are in JATS XML format, they transform to HTML:

```typescript
import { transformJatsToHtml } from './jats'

const abstractHtml = transformJatsToHtml(work.abstract)
```

### 5. Error Handling
They have custom error types:

```typescript
class WorkIsNotFound extends Error {}      // 404 - DOI doesn't exist
class WorkIsUnavailable extends Error {}   // API error, network issue
class NotAPreprint extends Error {}        // Not a preprint (journal article, etc.)
class PreprintIsUnavailable extends Error {} // Unsupported publisher
```

---

## API COMPARISON

| Feature | CrossRef | DataCite | Japan Link Center |
|---------|----------|----------|-------------------|
| **Main Use** | Academic papers, preprints | Research data, datasets | Japanese content |
| **Rate Limit** | None (polite usage) | None | Unknown |
| **API Key** | Not required | Not required | Not required |
| **Response Format** | JSON | JSON | JSON |
| **Author Format** | given + family | givenName + familyName | first_name + last_name |
| **Date Format** | date-parts array | ISO string | year/month/day strings |
| **Abstract** | JATS XML | Plain text | Not included |
| **ORCID Support** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Type Validation** | type + subtype | resourceType + resourceTypeGeneral | content_type |

---

## RECOMMENDED APPROACH FOR WRITEBOOK MVP

### Option 1: CrossRef Only (Simplest)
```typescript
async function importFromDOI(doi: string) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`
  const response = await fetch(url)
  const data = await response.json()

  return {
    title: data.message.title?.[0],
    authors: data.message.author?.map(a =>
      a.given ? `${a.given} ${a.family}` : a.family
    ).join(', '),
    abstract: data.message.abstract,
    publishedDate: data.message.published?.['date-parts']?.[0]?.join('-'),
    url: data.message.resource?.primary?.URL
  }
}
```

**Pros:**
- Simple, one API call
- No fallback logic needed
- Covers most academic papers

**Cons:**
- Won't work for DataCite DOIs (Zenodo, OSF, etc.)
- No error handling

### Option 2: CrossRef + DataCite (Recommended)
Use the "With Fallback" example above.

**Pros:**
- Covers 95%+ of academic content
- More robust

**Cons:**
- Slightly more complex
- Two API calls if CrossRef fails

### Option 3: Full PREreview.org Approach (Overkill)
Use all three APIs with language detection, HTML sanitization, etc.

**Pros:**
- Covers 100% of use cases
- Production-ready

**Cons:**
- Complex, lots of dependencies
- Overkill for MVP

---

## MVP IMPLEMENTATION CHECKLIST

For Writebook MVP, use **Option 2** (CrossRef + DataCite):

**Week 1: DOI Import UI**
- [ ] Add "Import from DOI" button to dashboard
- [ ] Create form to enter DOI
- [ ] Show loading state while fetching

**Week 1: API Integration**
- [ ] Create `lib/doi.ts` file
- [ ] Implement CrossRef fetch function
- [ ] Implement DataCite fetch function (fallback)
- [ ] Add error handling (invalid DOI, not found, etc.)

**Week 1: Data Transformation**
- [ ] Parse CrossRef response → Book structure
- [ ] Parse DataCite response → Book structure
- [ ] Create book in Firestore with fetched data
- [ ] Create first page with abstract as content

**Week 1: Polish**
- [ ] Show preview before importing
- [ ] Allow editing before publishing
- [ ] Handle errors gracefully (show user-friendly messages)

**Code Structure:**
```
/lib/doi.ts
  - fetchFromCrossRef(doi)
  - fetchFromDatacite(doi)
  - importPaperFromDOI(doi) → { title, authors, abstract, date, url }

/components/ImportDOIForm.tsx
  - Input for DOI
  - Submit button
  - Loading state
  - Error display

/app/papers/import/page.tsx
  - Form wrapper
  - Preview imported data
  - Save to Firestore
```

---

## EXAMPLE DOIS TO TEST

**CrossRef (bioRxiv):**
- `10.1101/2024.01.001`

**CrossRef (PsyArXiv):**
- `10.31234/osf.io/abc123`

**DataCite (Zenodo):**
- `10.5281/zenodo.1234567`

**DataCite (OSF):**
- `10.17605/OSF.IO/ABC12`

**arXiv (DataCite):**
- `10.48550/arXiv.2401.00001`

---

## RESOURCES

**APIs:**
- CrossRef API Docs: https://api.crossref.org/swagger-ui/index.html
- DataCite API Docs: https://support.datacite.org/docs/api
- Japan Link Center: https://japanlinkcenter.org/top/service/jlc_api.html

**Libraries:**
- `doi-ts`: https://github.com/thewilkybarkid/doi-ts
- CrossRef metadata: https://www.crossref.org/documentation/retrieve-metadata/

**PREreview.org Source:**
- GitHub: https://github.com/PREreview/prereview.org
- Key files:
  - `/src/ExternalApis/Crossref/`
  - `/src/ExternalApis/Datacite/`
  - `/src/Preprints/`

---

## NEXT STEPS

1. **Implement basic CrossRef integration** (1-2 hours)
2. **Add DataCite fallback** (1 hour)
3. **Create import UI** (2-3 hours)
4. **Test with real DOIs** (1 hour)
5. **Polish & error handling** (2 hours)

**Total time: ~1 day of development**

**Ready to ship! 🚀**
