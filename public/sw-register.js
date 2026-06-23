(function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(function (error) {
        console.warn('Falha ao registrar service worker:', error);
      });
  });
})();
