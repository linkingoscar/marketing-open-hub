export interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number | null;
  citationCount: number;
  authors: { authorId: string; name: string }[];
  venue: string | null;
  url: string;
  fieldsOfStudy: string[] | null;
  isOpenAccess: boolean;
  openAccessPdf?: { url: string };
}

export interface SearchResult {
  total: number;
  papers: SemanticScholarPaper[];
}

const BASE = "https://api.semanticscholar.org/graph/v1";

export async function searchPapers(
  query: string,
  limit = 20,
  year?: string,
  fieldsOfStudy?: string[]
): Promise<SearchResult> {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    fields: "paperId,title,abstract,year,citationCount,authors,venue,url,fieldsOfStudy,isOpenAccess,openAccessPdf",
  });
  if (year) params.set("year", year);
  if (fieldsOfStudy?.length) params.set("fieldsOfStudy", fieldsOfStudy.join(","));

  const res = await fetch(`${BASE}/paper/search?${params}`);
  if (!res.ok) throw new Error(`Semantic Scholar API error: ${res.status}`);
  const data = await res.json();
  return {
    total: data.total ?? 0,
    papers: (data.data ?? []) as SemanticScholarPaper[],
  };
}
