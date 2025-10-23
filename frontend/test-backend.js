// Tester si le backend rÃ©pond
fetch('https://ecolojia-backendvf.onrender.com/api/analysis/ping', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
.then(res => res.json())
.then(data => console.log('âœ… Backend connectÃ©:', data))
.catch(err => console.error('âŒ Erreur backend:', err));
