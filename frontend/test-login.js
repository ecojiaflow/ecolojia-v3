// Test de connexion
const testAuth = async () => {
  try {
    const response = await fetch('https://ecolojia-backendvf.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@ecolojia.app',
        password: 'Demo2025!'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('Connexion réussie !');
      window.location.href = '/';
    } else {
      console.error('Échec connexion:', await response.text());
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};

testAuth();
