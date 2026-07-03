const CACHE='ktp-v145';
const STATIC=[
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Merriweather&family=Lora&family=DM+Sans&display=swap'
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.hostname.includes('supabase.co'))return;
  if(e.request.method!=='GET')return;

  // HTML dosyaları için her zaman network-first
  const isHTML=url.pathname==='/'||url.pathname.endsWith('.html');
  if(isHTML){
    e.respondWith(
      fetch(e.request).then(resp=>{
        if(resp&&resp.status===200){
          const clone=resp.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return resp;
      }).catch(()=>caches.match(e.request)||new Response('Offline',{status:503}))
    );
    return;
  }

  // Diğer statik dosyalar için cache-first
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached)return cached;
      return fetch(e.request).then(resp=>{
        if(resp&&resp.status===200&&resp.type==='basic'){
          const clone=resp.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return resp;
      }).catch(()=>new Response('Offline',{status:503}));
    })
  );
});
