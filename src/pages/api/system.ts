import type { APIRoute } from 'astro';
import os from 'node:os';
export const prerender = false;
const cpuSnapshot = () => os.cpus().reduce((sum, cpu) => { const t=cpu.times; return { idle:sum.idle+t.idle, total:sum.total+t.user+t.nice+t.sys+t.irq+t.idle }; }, { idle:0, total:0 });
export const GET: APIRoute = async () => {
  const before=cpuSnapshot();await new Promise(resolve=>setTimeout(resolve,180));const after=cpuSnapshot();const cpu=Math.max(0,Math.min(100,Math.round(100-(after.idle-before.idle)/Math.max(1,after.total-before.total)*100)));const total=os.totalmem(),free=os.freemem();
  const check=async(url:string)=>{try{const r=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(2500)});return r.ok;}catch{return false;}};
  const [github,wakatime]=await Promise.all([check('https://api.github.com'),check('https://wakatime.com/api/v1/statusbar')]);
  const uptimeSec=Math.floor(os.uptime());const uptime=uptimeSec>86400?`${Math.floor(uptimeSec/86400)}d ${Math.floor(uptimeSec%86400/3600)}h`:`${Math.floor(uptimeSec/3600)}h ${Math.floor(uptimeSec%3600/60)}m`;
  return Response.json({cpu,memory:Math.round((1-free/total)*100),uptime,services:{github,wakatime},platform:os.platform()},{headers:{'Cache-Control':'no-store'}});
};
