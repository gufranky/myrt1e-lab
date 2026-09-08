import type { APIRoute } from 'astro';
export const prerender = false;
const descriptions: Record<number,string> = {0:'晴朗',1:'大致晴朗',2:'局部多云',3:'阴天',45:'雾',48:'雾凇',51:'小雨',53:'中雨',55:'大雨',61:'小雨',63:'中雨',65:'大雨',71:'小雪',73:'中雪',75:'大雪',80:'阵雨',81:'强阵雨',82:'暴雨',95:'雷暴'};
export const GET: APIRoute = async ({ request }) => {
  try {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const ip = forwarded || request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip');
    const path = ip && !ip.startsWith('127.') && ip !== '::1' ? `/${encodeURIComponent(ip)}` : '';
    let geo:any;
    try { const r=await fetch(`https://ipwho.is${path}`); geo=await r.json(); } catch {}
    if(!geo?.latitude){const r=await fetch('https://get.geojs.io/v1/ip/geo.json');geo=await r.json();}
    const lat=Number(geo.latitude),lon=Number(geo.longitude);if(!Number.isFinite(lat)||!Number.isFinite(lon))throw new Error('no coordinates');
    const weather=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&timezone=auto`).then(r=>r.json());
    const current=weather.current||{};return Response.json({city:geo.city||geo.region||geo.country,region:geo.region,country:geo.country,timezone:weather.timezone||geo.timezone?.id,temperature:current.temperature_2m,isDay:Boolean(current.is_day),code:current.weather_code,description:descriptions[current.weather_code]||'天气数据'});
  } catch { return Response.json({error:'weather unavailable'},{status:503}); }
};
