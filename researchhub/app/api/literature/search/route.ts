import { NextRequest, NextResponse } from "next/server";

type YearPoint = { year: number; count: number };

const PUBMED_SEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const CROSSREF_WORKS = "https://api.crossref.org/works";

async function pubmedCount(term: string): Promise<number> {
  const params = new URLSearchParams({ db: "pubmed", term, retmode: "json", retmax: "0", tool: "researchhub" });
  const response = await fetch(`${PUBMED_SEARCH}?${params.toString()}`, { headers: { "User-Agent": "ResearchHub/0.1 literature-prototype" }, cache: "no-store" });
  if (!response.ok) throw new Error("Falha ao consultar o PubMed");
  const data = await response.json();
  return Number(data?.esearchresult?.count ?? 0);
}

async function crossrefCount(term: string): Promise<number | null> {
  try {
    const params = new URLSearchParams({ "query.bibliographic": term, rows: "0" });
    const response = await fetch(`${CROSSREF_WORKS}?${params.toString()}`, { headers: { "User-Agent": "ResearchHub/0.1 literature-prototype" }, cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return Number(data?.message?.["total-results"] ?? 0);
  } catch {
    return null;
  }
}

function sleep(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = String(body?.topic ?? "").trim();
    if (topic.length < 3 || topic.length > 300) return NextResponse.json({ error: "Informe um tema entre 3 e 300 caracteres." }, { status: 400 });

    const currentYear = new Date().getFullYear();
    const startRecentYear = currentYear - 4;
    const [total, systematicReviews, clinicalTrials, recent, crossref] = await Promise.all([
      pubmedCount(topic),
      pubmedCount(`(${topic}) AND systematic review[Publication Type]`),
      pubmedCount(`(${topic}) AND clinical trial[Publication Type]`),
      pubmedCount(`(${topic}) AND (\"${startRecentYear}/01/01\"[Date - Publication] : \"3000\"[Date - Publication])`),
      crossrefCount(topic),
    ]);

    const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);
    const timeline: YearPoint[] = [];
    for (let i = 0; i < years.length; i += 2) {
      const batch = years.slice(i, i + 2);
      const counts = await Promise.all(batch.map((year) => pubmedCount(`(${topic}) AND (\"${year}/01/01\"[Date - Publication] : \"${year}/12/31\"[Date - Publication])`)));
      batch.forEach((year, index) => timeline.push({ year, count: counts[index] }));
      if (i + 2 < years.length) await sleep(350);
    }

    const trendFirst = timeline.slice(0, 3).reduce((sum, item) => sum + item.count, 0);
    const trendLast = timeline.slice(-3).reduce((sum, item) => sum + item.count, 0);
    const trend = trendLast > trendFirst * 1.2 ? "growing" : trendLast < trendFirst * 0.8 ? "declining" : "stable";
    let breadth: "very_broad" | "broad" | "balanced" | "niche" | "scarce" = "balanced";
    if (total >= 5000) breadth = "very_broad"; else if (total >= 1000) breadth = "broad"; else if (total >= 100) breadth = "balanced"; else if (total >= 20) breadth = "niche"; else breadth = "scarce";

    return NextResponse.json({
      topic,
      sources: { pubmed: { total, recent, systematicReviews, clinicalTrials }, crossref: { total: crossref } },
      timeline,
      signals: { breadth, trend, recentRatio: total > 0 ? recent / total : 0 },
      generatedAt: new Date().toISOString(),
      methodology: "As contagens são resultados de busca por termo e não equivalem a uma revisão sistemática nem comprovam originalidade científica.",
    });
  } catch (error) {
    console.error("literature/search error", error);
    return NextResponse.json({ error: "Não foi possível consultar as bases agora. Tente novamente em alguns segundos." }, { status: 502 });
  }
}
