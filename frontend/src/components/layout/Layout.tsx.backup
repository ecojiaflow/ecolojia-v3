import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Leaf, Menu, X, User, BarChart3, Search, 
  MessageCircle, Crown, LogOut, Camera 
} from 'lucide-react';
import { useAuthContext } from '../../Contexts/AuthContext';
import { useQuota } from '../../hooks/useQuota';
import { MobileBottomNav } from './MobileBottomNav';
import { useDeviceContext } from '../../hooks/useDeviceContext';
import Footer from '../Footer';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthContext();
  const { quotas } = useQuota();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMobile } = useDeviceContext();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Accueil', href: '/', icon: null },
    { name: 'Rechercher', href: '/search', icon: Search },
    { name: 'OCR', href: '/ocr', icon: Camera },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, requiresAuth: true },
    { name: 'Chat IA', href: '/chat', icon: MessageCircle, requiresAuth: true }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - masqué sur mobile */}
      <header className={`bg-white border-b border-gray-200 ${isMobile ? 'hidden' : 'block'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-green-500" />
              <span className="text-xl font-bold text-gray-800">ECOLOJIA</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation
                .filter(item => !item.requiresAuth || isAuthenticated)
                .map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-green-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span>{item.name}</span>
                  </Link>
                ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Quota Display */}
              {isAuthenticated && quotas && (
                <div className="hidden md:flex items-center space-x-2 text-sm">
                  <div className="px-3 py-1 bg-gray-100 rounded-full">
                    <span className="text-gray-600">Scans: </span>
                    <span className="font-medium text-gray-800">
                      {quotas.scansRemaining}/{user?.subscription?.tier === 'premium' ? '∞' : '30'}
                    </span>
                  </div>
                  {user?.subscription?.tier === 'free' && (
                    <Link
                      to="/premium"
                      className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-md transition-shadow"
                    >
                      <Crown className="w-4 h-4 inline mr-1" />
                      Premium
                    </Link>
                  )}
                </div>
              )}

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user?.firstName?.[0]?.toUpperCase()}
                    </div>
                  </button>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="w-4 h-4 inline mr-2" />
                        Mon profil
                      </Link>
                      <Link
                        to="/history"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Historique
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 inline mr-2" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
                  >
                    S'inscrire
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-4 py-4 space-y-2">
              {navigation
                .filter(item => !item.requiresAuth || isAuthenticated)
                .map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2 rounded-lg ${
                      isActive(item.href)
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              
              {isAuthenticated && (
                <>
                  <hr className="my-2" />
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    Mon profil
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    Déconnexion
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content - padding bottom pour mobile */}
      <main className={`flex-1 ${isMobile ? 'pb-20' : ''}`}>
        <Outlet />
      </main>

      {/* Footer - masqué sur mobile */}
      <footer className={`${isMobile ? 'hidden' : 'block'}`}>
        <Footer />
      </footer>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default Layout;

