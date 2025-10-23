// Injection utilisateur mock
const user = {
  id: 'mock-user',
  email: 'demo@ecolojia.app',
  profile: { firstName: 'Demo', lastName: 'User' },
  plan: 'premium',
  quotas: { scansRemaining: 999999, aiChatsRemaining: 999999 }
};

localStorage.setItem('user', JSON.stringify(user));
localStorage.setItem('accessToken', 'fake-token');
localStorage.setItem('refreshToken', 'fake-refresh');

console.log('✅ Utilisateur injecté avec succès');
