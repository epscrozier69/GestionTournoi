const CACHE_NAME = 'eps-gestion-v1';
const FICHIERS_A_METTRE_EN_CACHE = [
  './gestiontournois.html',
  './xlsx.full.min.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FICHIERS_A_METTRE_EN_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((noms) => Promise.all(
      noms.filter((nom) => nom !== CACHE_NAME).map((nom) => caches.delete(nom))
    ))
  );
  self.clients.claim();
});

// Pour les fichiers de l'application (html/js/manifest) : on essaie toujours
// le réseau en premier pour avoir la dernière version à jour, et on se
// rabat sur la version en cache si aucune connexion n'est disponible.
// Les appels vers Google Sheets / Google Apps Script ne sont pas concernés :
// l'application gère déjà elle-même son fonctionnement hors ligne pour ceux-ci.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  event.respondWith(
    fetch(event.request).then((reponse) => {
      const copie = reponse.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copie));
      return reponse;
    }).catch(() => caches.match(event.request))
  );
});
