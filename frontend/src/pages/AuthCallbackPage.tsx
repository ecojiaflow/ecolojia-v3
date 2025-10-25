function AuthCallbackPage() {
  // Logger dans fichier via fetch
  const logDebug = (message) => {
    console.log('[DEBUG]', message);
    // Envoyer au backend pour logger
    fetch('http://localhost:10000/api/debug-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        url: window.location.href,
        message: message
      })
    }).catch(() => {});
  };

  logDebug('CALLBACK MOUNTED - URL: ' + window.location.href);

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const refresh = params.get('refreshToken');
  const userEnc = params.get('user');

  logDebug('Token present: ' + !!token);
  logDebug('User present: ' + !!userEnc);
  logDebug('Full search: ' + window.location.search);

  if (token && userEnc) {
    try {
      localStorage.setItem('ecolojia_token', token);
      localStorage.setItem('ecolojia_refresh', refresh || token);
      localStorage.setItem('ecolojia_user', decodeURIComponent(userEnc));
      
      logDebug('TOKENS STORED');
      
      setTimeout(() => {
        logDebug('REDIRECTING TO /');
        window.location.href = '/';
      }, 1000);
    } catch (e) {
      logDebug('ERROR: ' + e.message);
      window.location.href = '/login';
    }
  } else {
    logDebug('MISSING PARAMS - Redirect to login');
    window.location.href = '/login';
  }

  return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <h1>Connexion en cours...</h1>
      <p>Diagnostic automatique activé</p>
    </div>
  );
}

export default AuthCallbackPage;