if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("? Service Worker actif en production"))
      .catch((err) => console.warn("SW register failed:", err));
  });
} else {
  // Désactive en DEV pour éviter l'erreur 'sw.js:10'
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(regs => regs.forEach(r => r.unregister()))
      .catch(() => {});
  }
}
