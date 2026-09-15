import type { APIRoute } from 'astro';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const POST: APIRoute = async ({ request }) => {
  if (import.meta.env.PROD) return new Response('Layout publishing is disabled in production', { status: 403 });
  try {
    const parsed = await request.json();
    const items = Array.isArray(parsed) ? parsed : parsed?.items;
    if (!Array.isArray(items) || items.length > 20) return new Response('Invalid layout', { status: 400 });
    const valid = items.every((item) => item && typeof item.id === 'string' && typeof item.kind === 'string'
      && ['x', 'y', 'w', 'h'].every((key) => Number.isFinite(item[key]))
      // The editor is a world-space canvas: x/y may be any finite value,
      // including negative coordinates.
      && item.w >= 180 && item.h >= 140);
    if (!valid) return new Response('Invalid layout items', { status: 400 });
    const output = {
      version: 1,
      baseWidth: Number.isFinite(parsed?.baseWidth) ? parsed.baseWidth : 1600,
      baseHeight: Number.isFinite(parsed?.baseHeight) ? parsed.baseHeight : 1680,
      items,
    };
    const file = path.resolve(process.cwd(), 'data', 'showcase-layout.json');
    await mkdir(path.dirname(file), { recursive: true });
    const temp = `${file}.tmp`;
    await writeFile(temp, JSON.stringify(output, null, 2), 'utf8');
    await rename(temp, file);
    return new Response('ok');
  } catch {
    return new Response('Unable to save layout', { status: 400 });
  }
};
