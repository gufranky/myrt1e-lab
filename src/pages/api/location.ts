type LocationPayload = {
  success: boolean;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  timezone?: { id?: string; utc?: string };
  provider?: string;
};

export const prerender = false;

const json = (payload: LocationPayload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export async function GET({ request }: { request: Request }) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const clientIp = forwarded || request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip');
  const ipPath = clientIp && !clientIp.startsWith('127.') && clientIp !== '::1' ? `/${encodeURIComponent(clientIp)}` : '';

  try {
    const response = await fetch(`https://ipwho.is${ipPath}`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`ipwho status ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('ipwho returned an unsuccessful response');
    return json({
      success: true,
      city: data.city,
      region: data.region,
      country: data.country,
      countryCode: data.country_code,
      country_code: data.country_code,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      timezone: { id: data.timezone?.id, utc: data.timezone?.utc },
      provider: 'ipwho.is',
    });
  } catch {
    try {
      const response = await fetch(`https://get.geojs.io/v1/ip/geo.json`, { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error(`geojs status ${response.status}`);
      const data = await response.json();
      return json({
        success: true,
        city: data.city,
        region: data.region,
        country: data.country,
        countryCode: data.country_code,
        country_code: data.country_code,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        timezone: { id: data.timezone },
        provider: 'GeoJS',
      });
    } catch {
      return json({ success: false }, 503);
    }
  }
}
