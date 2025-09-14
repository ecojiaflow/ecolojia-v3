// Garder le serveur Render éveillé
setInterval(() => {
  fetch('https://ecolojia-backendvf.onrender.com/api/products/trending')
    .then(() => console.log('Ping serveur:', new Date().toLocaleTimeString()))
    .catch(err => console.error('Erreur ping:', err));
}, 10 * 60 * 1000); // Toutes les 10 minutes

console.log('Keep alive démarré');
