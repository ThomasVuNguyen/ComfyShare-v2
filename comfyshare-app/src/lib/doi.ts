export type DoiMetadata = {
  title: string
  authors?: string[]
  abstract?: string
  published?: string
  url?: string
  source: "crossref" | "datacite"
}

type CrossrefAuthor = { given?: string; family?: string; name?: string }
type CrossrefMessage = {
  title?: string[]
  author?: CrossrefAuthor[]
  abstract?: string
  resource?: { primary?: { URL?: string } }
  URL?: string
  ["published"]?: { "date-parts"?: number[][] }
}

type DataCiteAttributes = {
  titles?: { title?: string }[]
  creators?: { name?: string }[]
  descriptions?: { description?: string }[]
  published?: string
  url?: string
}

const crossrefUrl = (doi: string) => `https://api.crossref.org/works/${encodeURIComponent(doi)}`
const dataciteUrl = (doi: string) => `https://api.datacite.org/dois/${encodeURIComponent(doi)}`

const normalizeCrossref = (payload: unknown): DoiMetadata | null => {
  if (!payload || typeof payload !== "object") return null
  const message = (payload as { message?: CrossrefMessage }).message
  if (!message) return null

  const authors = message.author
    ?.map((author) => [author.given, author.family, author.name].filter(Boolean).join(" ").trim())
    .filter(Boolean) as string[] | undefined

  return {
    title: message.title?.[0] ?? "",
    authors,
    abstract: message.abstract,
    published: message["published"]?.["date-parts"]?.[0]?.join("-"),
    url: message.resource?.primary?.URL ?? message.URL,
    source: "crossref",
  }
}

const normalizeDataCite = (payload: unknown): DoiMetadata | null => {
  if (!payload || typeof payload !== "object") return null
  const attributes = (payload as { data?: { attributes?: DataCiteAttributes } }).data?.attributes
  if (!attributes) return null

  return {
    title: attributes.titles?.[0]?.title ?? "",
    authors: attributes.creators?.map((creator) => creator.name ?? "").filter(Boolean),
    abstract: attributes.descriptions?.[0]?.description,
    published: attributes.published,
    url: attributes.url,
    source: "datacite",
  }
}

export const fetchDoiMetadata = async (doi: string): Promise<DoiMetadata | null> => {
  const crossrefResponse = await fetch(crossrefUrl(doi))
  if (crossrefResponse.ok) {
    const data: unknown = await crossrefResponse.json()
    const normalized = normalizeCrossref(data)
    if (normalized && normalized.title) {
      return normalized
    }
  }

  const dataciteResponse = await fetch(dataciteUrl(doi))
  if (dataciteResponse.ok) {
    const data: unknown = await dataciteResponse.json()
    const normalized = normalizeDataCite(data)
    if (normalized && normalized.title) {
      return normalized
    }
  }

  return null
}
