const C='exbrayat-chauffage-v022';
const F=['./','./index.html','./style.css','./app.js','./pdf-lib.min.js','./logo-exbrayat.png','./attestation-gaz.pdf','./attestation-fioul.pdf','./attestation-granules.pdf'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))).then(()=>self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k))))).then(()=>self.clients.claim()));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(C).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request))));
