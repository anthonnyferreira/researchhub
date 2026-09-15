import { NextRequest, NextResponse } from "next/server";

type YearPoint = { year: number; count: number };
type PubmedSearch = { count: number; ids: string[] };

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const CROSSREF_WORKS = "https://api.crossref.org/works";
const NCBI_API_KEY = process.env.NCBI_API_KEY;

function ncbiParams(values: Record<string, string>) {
  const params = new URLSearchParams({ ...values, tool: "researchhub", email: "researchhub@example.com" });
  if (NCBI_API_KEY) params.set("api_key", NCBI_API_KEY);
  return params;
}

async function pubmedSearch(term: string, retmax = 0, sort?: string): Promise<PubmedSearch> {
  const params = ncbiParams({ db: "pubmed", term, retmode: "json", retmax: String(retmax) });
  if (sort) params.set("sort", sort);
  const response = await fetch(`${PUBMED_BASE}/esearch.fcgi?${params.toString()}`, {
    headers: { "User-Agent": "ResearchHub/0.1 literature-prototype" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Falha ao consultar o PubMed");
  const data = await response.json();
  return {
    count: Number(data?.esearchresult?.count ?? 0),
    ids: Array.isArray(data?.esearchresult?.idlist) ? data.esearchresult.idlist : [],
  };
}

async function crossrefCount(term: string): Promise<number | null> {
  try {
    const params = new URLSearchParams({ "query.bibliographic": term, rows: "0" });
    const response = await fetch(`${CROSSREF_WORKS}?${params.toString()}`, {
      headers: { "User-Agent": "ResearchHub/0.1 literature-prototype" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return Number(data?.message?.["total-results"] ?? 0);
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeXml(value = "") {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAbstracts(xml: string) {
  const map = new Map<string, string>();
  const articles = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) ?? [];
  for (const article of articles) {
    const pmid = article.match(/<PMID[^>]*>([^<]+)<\/PMID>/)?.[1];
    if (!pmid) continue;
    const abstractParts = [...article.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)].map((m) => decodeXml(m[1]));
    if (abstractParts.length) map.set(pmid, abstractParts.join(" "));
  }
  return map;
}

async function fetchArticleDetails(ids: string[]) {
  if (!ids.length) return [];

  const summaryParams = ncbiParams({ db: "pubmed", id: ids.join(","), retmode: "json" });
  const fetchParams = ncbiParams({ db: "pubmed", id: ids.join(","), retmode: "xml" });

  const [summaryResponse, abstractResponse] = await Promise.all([
    fetch(`${PUBMED_BASE}/esummary.fcgi?${summaryParams.toString()}`, { cache: "no-store" }),
    fetch(`${PUBMED_BASE}/efetch.fcgi?${fetchParams.toString()}`, { cache: "no-store" }),
  ]);

  if (!summaryResponse.ok) return [];
  const summary = await summaryResponse.json();
  const abstractXml = abstractResponse.ok ? await abstractResponse.text() : "";
  const abstracts = extractAbstracts(abstractXml);

  return ids.map((pmid) => {
    const item = summary?.result?.[pmid] ?? {};
    const articleIds = Array.isArray(item.articleids) ? item.articleids : [];
    const doi = articleIds.find((x: any) => x.idtype === "doi")?.value ?? null;
    const authors = Array.isArray(item.authors) ? item.authors.map((x: any) => x.name).filter(Boolean) : [];
    const pubdate = String(item.pubdate ?? "");
    const year = Number(pubdate.match(/\d{4}/)?.[0] ?? 0) || null;

    return {
      pmid,
      doi,
      title: String(item.title ?? "Sem título"),
      authors,
      journal: String(item.fulljournalname || item.source || ""),
      pubdate,
      year,
      publicationTypes: Array.isArray(item.pubtype) ? item.pubtype : [],
      abstract: abstracts.get(pmid) ?? null,
      pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      doiUrl: doi ? `https://doi.org/${doi}` : null,
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = String(body?.topic ?? "").trim();
    if (topic.length < 3 || topic.length > 300) {
      return NextResponse.json({ error: "Informe um tema entre 3 e 300 caracteres." }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const startRecentYear = currentYear - 4;

    // A busca principal também retorna os PMIDs mais recentes para a camada de artigos.
    const mainSearch = await pubmedSearch(topic, 8, "pub date");
    if (!NCBI_API_KEY) await sleep(350);

    const [systematic, trials, recent, crossref] = await Promise.all([
      pubmedSearch(`(${topic}) AND systematic review[Publication Type]`),
      pubmedSearch(`(${topic}) AND clinical trial[Publication Type]`),
      pubmedSearch(`(${topic}) AND (\"${startRecentYear}/01/01\"[Date - Publication] : \"3000\"[Date - Publication])`),
      crossrefCount(topic),
    ]);

    if (!NCBI_API_KEY) await sleep(400);

    const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);
    const timeline: YearPoint[] = [];
    for (const year of years) {
      const result = await pubmedSearch(`(${topic}) AND (\"${year}/01/01\"[Date - Publication] : \"${year}/12/31\"[Date - Publication])`);
      timeline.push({ year, count: result.count });
      if (!NCBI_API_KEY) await sleep(350);
    }

    const articles = await fetchArticleDetails(mainSearch.ids);
    const total = mainSearch.count;
    const trendFirst = timeline.slice(0, 3).reduce((sum, item) => sum + item.count, 0);
    const trendLast = timeline.slice(-3).reduce((sum, item) => sum + item.count, 0);
    const trend = trendLast > trendFirst * 1.2 ? "growing" : trendLast < trendFirst * 0.8 ? "declining" : "stable";

    let breadth: "very_broad" | "broad" | "balanced" | "niche" | "scarce" = "balanced";
    if (total >= 5000) breadth = "very_broad";
    else if (total >= 1000) breadth = "broad";
    else if (total >= 100) breadth = "balanced";
    else if (total >= 20) breadth = "niche";
    else breadth = "scarce";

    return NextResponse.json({
      topic,
      sources: {
        pubmed: {
          total,
          recent: recent.count,
          systematicReviews: systematic.count,
          clinicalTrials: trials.count,
        },
        crossref: { total: crossref },
      },
      articles,
      timeline,
      signals: { breadth, trend, recentRatio: total > 0 ? recent.count / total : 0 },
      generatedAt: new Date().toISOString(),
      methodology:
        "As contagens e artigos são recuperados do PubMed/Crossref a partir dos termos informados. Isso não equivale a uma revisão sistemática e não comprova, isoladamente, originalidade ou lacuna científica.",
    });
  } catch (error) {
    console.error("literature/search error", error);
    return NextResponse.json(
      { error: "Não foi possível consultar as bases agora. Tente novamente em alguns segundos." },
      { status: 502 }
    );
  }
}
