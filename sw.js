/* TRAZA360 · Service Worker
   Guarda SOLO la carcasa de la app (HTML, manifest e iconos) para que abra rápido.
   NUNCA guarda datos operativos: las llamadas a Google (script.google.com) no se interceptan. */
const VERSION = "t360-v2";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;   // nada de Google ni de POST
  if (url.pathname.endsWith("Code.gs.txt")) return;                           // el visor de código siempre va a red
  // Red primero (para recibir actualizaciones); si no hay red, la carcasa guardada.
  e.respondWith(fetch(req).then(res => {
    if (res.ok && SHELL.some(s => url.pathname.endsWith(s.replace("./", "")) || url.pathname.endsWith("/"))) {
      const copia = res.clone(); caches.open(VERSION).then(c => c.put(req, copia));
    }
    return res;
  }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
});
