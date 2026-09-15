const tracks = [
  {title:'RTRT',id:'IcpzqZrpLVM'},
  {title:'Ga1ahad and Scientific Witchery',id:'d-nxW9qBtxQ'},
  {title:'world.execute(me);',id:'ESx_hy1n7HA'},
];
let index=0, playing=false, player:any, loading:Promise<void>|null=null;
let status='Mili · 点击播放';
const roots=new Set<HTMLElement>();
function render(){
  roots.forEach(root=>{
    if(!root.isConnected){roots.delete(root);return;}
    const track=tracks[index];
    const title=root.querySelector<HTMLElement>('[data-track-title]');
    if(title)title.textContent=track.title;
    const art=root.querySelector<HTMLImageElement>('[data-album-art]');
    if(art){const src='https://i.ytimg.com/vi/'+track.id+'/hqdefault.jpg';if(art.src!==src){art.hidden=false;art.src=src;}art.alt='Mili · '+track.title+' 官方歌曲封面';}
    root.querySelectorAll('[data-player-state]').forEach(el=>el.textContent=status);
    const toggle=root.querySelector('[data-player-toggle]');
    toggle?.setAttribute('aria-pressed',String(playing));
    toggle?.setAttribute('aria-label',playing?'暂停 Mili':'播放 Mili');
    if(toggle)toggle.innerHTML=playing?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM14 5h3v14h-3z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 12 7-12 7Z"/></svg>';
    root.classList.toggle('is-playing',playing);
    const song=title?.parentElement;
    if(song?.classList.contains('dossier-song')){const over=title!.scrollWidth-song.clientWidth;song.classList.toggle('is-overflowing',over>0);song.style.setProperty('--song-offset',-Math.max(0,over)+'px');}
  });
}
function ensurePlayer(){
  if(loading)return loading;
  loading=new Promise<void>((resolve,reject)=>{
    const w=window as any;
    const host=document.createElement('aside');
    host.setAttribute('aria-label','YouTube 音乐播放器');
    host.style.cssText='position:fixed;right:16px;bottom:16px;width:320px;max-width:calc(100vw - 32px);z-index:10000;background:#242724;color:white;padding:8px;box-shadow:0 4px 24px #0005';
    const close=document.createElement('button');close.textContent='收起并暂停';close.style.cssText='background:none;border:0;color:white;min-height:44px;cursor:pointer';
    close.onclick=()=>{player?.pauseVideo();host.hidden=true;};
    const mount=document.createElement('div');host.append(close,mount);document.body.append(host);
    const timer=setTimeout(()=>{status='YouTube 加载失败，请重试';loading=null;host.remove();render();reject(new Error('YouTube timeout'));},15000);
    const init=()=>{player=new w.YT.Player(mount,{width:'100%',height:'200',host:'https://www.youtube-nocookie.com',videoId:tracks[index].id,playerVars:{playsinline:1},events:{
      onReady:()=>{clearTimeout(timer);resolve();},
      onStateChange:(event:any)=>{playing=event.data===1;status=event.data===1?'Mili · 播放中':event.data===3?'Mili · 缓冲中':'Mili · 已暂停';render();},
      onError:()=>{playing=false;status='歌曲暂时无法播放，可切换歌曲';render();}
    }});};
    if(w.YT?.Player)init();else{const previous=w.onYouTubeIframeAPIReady;w.onYouTubeIframeAPIReady=()=>{previous?.();init();};if(!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')){const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';document.head.append(script);}}
  });
  return loading;
}
export function bindMusic(root:HTMLElement){
  roots.add(root);
  root.querySelector('[data-player-embed]')?.remove();
  root.querySelector<HTMLElement>('[data-player-time]')?.remove();
  const progress=root.querySelector<HTMLElement>('[data-progress]');if(progress)progress.parentElement!.hidden=true;
  root.querySelector<HTMLButtonElement>('[data-player-toggle]')!.onclick=async()=>{
    if(playing){player?.pauseVideo();return;}
    status='正在连接 YouTube…';render();
    try{await ensurePlayer();document.querySelector<HTMLElement>('aside[aria-label="YouTube 音乐播放器"]')!.hidden=false;player.playVideo();}catch{}
  };
  const change=(step:number)=>{index=(index+step+tracks.length)%tracks.length;if(player){if(playing)player.loadVideoById(tracks[index].id);else player.cueVideoById(tracks[index].id);}render();};
  root.querySelector<HTMLButtonElement>('[data-player-next]')!.onclick=()=>change(1);
  root.querySelector<HTMLButtonElement>('[data-player-prev]')!.onclick=()=>change(-1);
  render();
}
window.addEventListener('resize',render);
