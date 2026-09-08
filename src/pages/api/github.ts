import type { APIRoute } from 'astro';

type Stats = { commits: number; repos: number | null; languages: Record<string, number>; updated: string };
let cache: Stats | null = null;
let cacheTime = 0;
let refreshPromise: Promise<Stats> | null = null;
const CACHE_TTL = 10 * 60 * 1000;

async function fetchStats(): Promise<Stats> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'myrt1e-workspace' };
  if (import.meta.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${import.meta.env.GITHUB_TOKEN}`;
  const [eventsResponse, reposResponse] = await Promise.all([fetch('https://api.github.com/users/gufranky/events/public', { headers }), fetch('https://api.github.com/users/gufranky/repos?per_page=100&sort=updated', { headers })]);
  const events = eventsResponse.ok ? await eventsResponse.json() : []; const repositories = reposResponse.ok ? await reposResponse.json() : [];
  let repoCount = repositories.length;
  if (!repoCount) { try { const profile = await fetch('https://github.com/gufranky?tab=repositories', { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'myrt1e-workspace' } }); if (profile.ok) repoCount = (await profile.text()).match(/itemprop="name codeRepository"/g)?.length || 0; } catch {} }
  let contributionData: any = null;
  try { const response = await fetch('https://github.com/users/gufranky/contributions?from=2025-09-08&to=2026-09-08', { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'myrt1e-workspace' } }); if (response.ok) { const html = await response.text(); const counts = [...html.matchAll(/>(\d+) contribution/g)].map(match => Number(match[1])); contributionData = { count: counts.reduce((sum, count) => sum + count, 0) }; } } catch {}
  if (!contributionData) { try { const response = await fetch('https://github-contributions-api.jogruber.de/v4/gufranky?y=last', { signal: AbortSignal.timeout(5000) }); if (response.ok) contributionData = await response.json(); } catch {} }
  let commits = contributionData?.count || contributionData?.contributions?.reduce((total: number, day: any) => total + Number(day.count || 0), 0) || 0;
  if (!commits) { const counts = await Promise.all(repositories.slice(0, 20).map(async (repo: any) => { try { const response = await fetch(`https://api.github.com/repos/gufranky/${repo.name}/commits?author=gufranky&per_page=1`, { headers }); if (!response.ok) return 0; const last = (response.headers.get('link') || '').match(/[?&]page=(\d+)>; rel="last"/); if (last) return Number(last[1]); const data = await response.json(); return Array.isArray(data) ? data.length : 0; } catch { return 0; } })); commits = counts.reduce((sum, count) => sum + count, 0); }
  const languageBytes: Record<string, number> = {}; const languageRepos: Record<string, number> = {};
  await Promise.all(repositories.slice(0, 100).map(async (repo: any) => { try { const response = await fetch(`https://api.github.com/repos/gufranky/${repo.name}/languages`, { headers }); const data = response.ok ? await response.json() : {}; Object.entries(data).forEach(([name, bytes]) => { languageBytes[name] = (languageBytes[name] || 0) + Number(bytes); languageRepos[name] = (languageRepos[name] || 0) + 1; }); } catch {} }));
  if (!Object.keys(languageBytes).length) repositories.forEach((repo: any) => { if (repo.language) { languageBytes[repo.language] = (languageBytes[repo.language] || 0) + 1; languageRepos[repo.language] = (languageRepos[repo.language] || 0) + 1; } });
  if (!Object.keys(languageBytes).length) { try { const response = await fetch('https://github-stats-extended.vercel.app/api/top-langs/?username=gufranky&layout=compact', { signal: AbortSignal.timeout(8000) }); if (response.ok) { const svg = await response.text(); for (const match of svg.matchAll(/class=['"]lang-name['"][^>]*>\s*([^<]+)</g)) { const parsed = match[1].trim().match(/^(.+?)\s+([\d.]+)%$/); if (parsed) { languageBytes[parsed[1]] = Number(parsed[2]); languageRepos[parsed[1]] = 0; } } } } catch {} }
  const totalBytes = Object.values(languageBytes).reduce((sum, value) => sum + value, 0) || 1;
  const languages = Object.fromEntries(Object.entries(languageBytes).map(([name, bytes]) => [name, { bytes, repos: languageRepos[name] || 0, percent: Math.round(bytes / totalBytes * 100) }]).sort((a: any, b: any) => b[1].bytes - a[1].bytes));
  return { commits, repos: repoCount || null, languages, updated: new Date().toISOString() };
}

export const GET: APIRoute = async () => {
  try {
    if (cache && Date.now() - cacheTime < CACHE_TTL) return new Response(JSON.stringify(cache), { headers: { 'Content-Type': 'application/json', 'X-Data-Source': 'server-cache' } });
    refreshPromise ||= fetchStats();
    const fresh = await refreshPromise; refreshPromise = null; cache = fresh; cacheTime = Date.now();
    return new Response(JSON.stringify(fresh), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Data-Source': 'github-refresh' } });
  } catch {
    refreshPromise = null;
    if (cache) return new Response(JSON.stringify(cache), { headers: { 'Content-Type': 'application/json', 'X-Data-Source': 'stale-server-cache' } });
    return new Response(JSON.stringify({ error: 'GitHub API 暂时不可用' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
};
