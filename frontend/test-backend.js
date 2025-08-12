// Tester si le backend répond
fetch('https://ecolojia-backendvf.onrender.com/api/analysis/ping', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
.then(res => res.json())
.then(data => console.log('✅ Backend connecté:', data))
.catch(err => console.error('❌ Erreur backend:', err));
