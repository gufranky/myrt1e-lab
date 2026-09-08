import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const key = import.meta.env.WAKATIME_API_KEY || process.env.WAKATIME_API_KEY;
  if (!key) return new Response(JSON.stringify({ hours: '--', source: '未配置 API KEY' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  try {
    const response = await fetch('https://wakatime.com/api/v1/users/current/all_time_since_today', { headers: { Authorization: `Basic ${btoa(key)}` } });
    if (!response.ok) throw new Error('WakaTime request failed');
    const data = await response.json();
    const stats = data.data || {};
    const hours = stats.text || stats.digital || `${Math.floor(Number(stats.total_seconds || 0) / 3600)}h`;
    return new Response(JSON.stringify({ hours, source: 'ALL TIME · LIVE' }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch {
    return new Response(JSON.stringify({ hours: '--', source: 'WakaTime 请求失败' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
};
