const API_URL = "https://ecolojia-backendvf.onrender.com/api";

class AuthService {
  constructor() {
    this.TOKEN_KEY = "auth_token";
    this.USER_KEY = "user_data";
    this.fakeUser = {
      id: "demo-user",
      email: "demo@ecoloji?.fr",
      name: "Utilisateur Demo",
      plan: "premium",
      quotas: {
        scans: 999999,
        aiChats: 999999
      }
    };
  }

  async login(credentials) {
    return {
      success: true,
      token: "fake-token",
      user: this.fakeUser
    };
  }

  async register(userData) {
    return {
      success: true,
      token: "fake-token",
      user: this.fakeUser
    };
  }

  logout() {
    // Ne rien faire
  }

  getUser() {
    return this.fakeUser;
  }

  getToken() {
    return "fake-token";
  }

  isAuthenticated() {
    return true;
  }

  isPremium() {
    // Toujours premium en mode demo
    return true;
  }

  getQuotas() {
    return {
      scans: 999999,
      aiChats: 999999
    };
  }
}

const authService = new AuthService();
export { authService };
export default authService;
