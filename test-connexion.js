const API_URL = 'https://ecolojia-backendvf.onrender.com/api';
console.log('Test rapide...');
fetch(API_URL + '/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend OK:', d))
  .catch(e => console.log('❌ Erreur:', e));
