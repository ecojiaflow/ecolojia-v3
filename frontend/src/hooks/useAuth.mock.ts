// PATH: src/hooks/useAuth.mock.ts
export const useAuth = () => {
  return {
    user: {
      id: 'test-user',
      email: 'test@test.com',
      firstName: 'Test',
      subscription: { tier: 'premium' }
    },
    isAuthenticated: true,
    login: async () => ({ success: true }),
    logout: () => {},
    register: async () => ({ success: true })
  };
};

export const useAuthContext = useAuth;
