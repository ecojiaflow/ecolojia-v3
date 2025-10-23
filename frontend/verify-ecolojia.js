// Script de vÃ©rification ECOLOJIA
console.log('=== VERIFICATION ECOLOJIA ===');

// 1. VÃ©rifier le token
const token = localStorage.getItem('ecolojia_token');
console.log('Token prÃ©sent:', !!token);

// 2. Tester le profil
if (token) {
    fetch('https://ecolojia-backendvf.onrender.com/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
        console.log('âœ… Profil chargÃ©:', data);
        if (data.user || data.email) {
            console.log('âœ… Authentification complÃ¨te !');
        }
    })
    .catch(err => console.error('âŒ Erreur profil:', err));
}

// 3. Tester le chat (avec timeout court)
console.log('\nTest du chat...');
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

fetch('https://ecolojia-backendvf.onrender.com/api/ai/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message: 'test' }),
    signal: controller.signal
})
.then(r => {
    clearTimeout(timeoutId);
    return r.json();
})
.then(data => console.log('âœ… Chat API:', data))
.catch(err => {
    if (err.name === 'AbortError') {
        console.log('âš ï¸ Chat API timeout - fallback local activÃ©');
    } else {
        console.error('âŒ Chat API erreur:', err);
    }
});
