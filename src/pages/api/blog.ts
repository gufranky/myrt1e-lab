import type { APIRoute } from 'astro';

const BLOG = 'https://blog.myrt1e.com/wp-json/wp/v2/posts?per_page=6&_fields=title,link,date,categories';
let cache: { posts: any[]; at: number } | null = null;
const decodeHtml = (value: string) => value.replace(/&#(x[0-9a-f]+|\d+);?/gi, (_, code) => String.fromCodePoint(code.toLowerCase().startsWith('x') ? parseInt(code.slice(1), 16) : Number(code))).replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, entity => ({ '&amp;':'&', '&lt;':'<', '&gt;':'>', '&quot;':'"', '&apos;':"'", '&nbsp;':' ' } as Record<string,string>)[entity] || entity);

export const GET: APIRoute = async () => {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return Response.json({ posts: cache.posts });
  try {
    const response = await fetch(BLOG, { headers: { Accept: 'application/json', 'User-Agent': 'myrt1e-lab' } });
    if (!response.ok) throw new Error('blog unavailable');
    const raw = await response.json();
    const posts = raw.map((post: any) => ({
      title: decodeHtml(String(post.title?.rendered || '').replace(/<[^>]+>/g, '')),
      link: post.link,
      date: post.date ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(post.date)) : '',
      category: 'BLOG'
    }));
    cache = { posts, at: Date.now() };
    return Response.json({ posts }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ posts: [], error: '博客暂时不可用' }, { status: 502 });
  }
};
