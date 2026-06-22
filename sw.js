// CARDIY Service Worker v1.0
const CACHE_NAME = 'cardiy-v1';
const STATIC_ASSETS = [
  '/APP/','/APP/index.html','/APP/login.html','/APP/app.html',
    '/APP/main.css','/APP/tokens.css','/APP/main.js','/APP/app.js',
      '/APP/manifest.json','/APP/logo-cardiy-mark.svg','/APP/logo-cardiy-primary.svg',
        '/APP/logo-cardiy-white.svg','/APP/logo-cardiy-brand.png',
        ];
        self.addEventListener('install',(e)=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(STATIC_ASSETS).catch(err=>console.warn('[SW] cache fail:',err))));self.skipWaiting();});
        self.addEventListener('activate',(e)=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
        self.addEventListener('fetch',(e)=>{
          const u=new URL(e.request.url);
            if(e.request.method!=='GET')return;
              if(u.hostname.includes('firebase')||u.hostname.includes('googleapis')||u.hostname.includes('anthropic')){
                  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));return;
                    }
                      e.respondWith(caches.match(e.request).then(cached=>{
                          if(cached)return cached;
                              return fetch(e.request).then(resp=>{
                                    if(!resp||resp.status!==200||resp.type!=='basic')return resp;
                                          const r=resp.clone();
                                                caches.open(CACHE_NAME).then(c=>c.put(e.request,r));
                                                      return resp;
                                                          }).catch(()=>{
                                                                if(e.request.destination==='document')return caches.match('/APP/login.html');
                                                                    });
                                                                      }));
                                                                      });
                                                                      self.addEventListener('push',(e)=>{
                                                                        if(!e.data)return;
                                                                          const d=e.data.json();
                                                                            self.registration.showNotification(d.title||'CARDIY',{body:d.body||'Thong bao moi tu CARDIY',icon:'/APP/logo-cardiy-mark.svg',badge:'/APP/logo-cardiy-mark.svg',tag:'cardiy-notification',data:{url:d.url||'/APP/app.html'}});
                                                                            });
                                                                            self.addEventListener('notificationclick',(e)=>{e.notification.close();e.waitUntil(clients.openWindow(e.notification.data?.url||'/APP/app.html'));});
