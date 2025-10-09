// Cache API requests for better offline experience
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return cached version or offline page
        return caches.match('/offline.html');
      })
    );
  }
});