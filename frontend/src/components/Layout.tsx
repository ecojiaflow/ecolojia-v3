// frontend/src/components/Layout.tsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Camera, 
  History, 
  User, 
  Settings, 
  LogOut,
  BarChart3,
  MessageCircle,
  Crown,
  Menu,
  X
} from 'lucide-react';
import { useAuthContext } from './Contexts/AuthContext';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthContext();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Erreur lors de la deconnexion:', error);
    }
  };

  const navigation = [
    { name: 'Accueil', href: '/', icon: Home },
    { name: 'Recherche', href: '/search', icon: Search },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Historique', href: '/history', icon: History },
    { name: 'Chat IA', href: '/chat', icon: MessageCircle, premium: true },
  ];

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Desktop */}
      <header className="bg-white shadow-sm sticky top-0 z-50 hidden md:block">
        <div className="max-w-none md:max-w-7xl mx-auto px-0 md:px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <NavLink to="/" className="flex items-center space-x-2">
                <span className="text-2xl">a</span>
                <span className="text-xl font-bold text-gray-800">ECOLOJIA</span>
              </NavLink>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.premium && user?.tier !== 'premium' && (
                    <Crown className="w-3 h-3 text-primary-1000" />
                  )}
                </NavLink>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Quotas */}
              <div className="hidden lg:flex items-center space-x-4 text-sm">
                <div className="text-gray-600">
                  <span className="font-medium">{user?.currentUsage?.scansThisMonth || 0}</span>
                  <span className="text-neutral-600">/{user?.quotas?.scansPerMonth === -1 ? 'aa' : user?.quotas?.scansPerMonth || 30} scans</span>
                </div>
                {user?.tier === 'premium' && (
                  <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-medium">
                    ? Premium
                  </span>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700">
                    {user?.name || 'Utilisateur'}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                        <p className="text-xs text-gray-600">{user?.email}</p>
                        <div className="mt-2">
                          {user?.tier === 'premium' ? (
                            <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              Gratuit
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-3 space-y-2 text-xs border-b border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Scans ce mois</span>
                          <span className="font-medium text-gray-800">
                            {user?.currentUsage?.scansThisMonth || 0}
                            {user?.quotas?.scansPerMonth !== -1 && `/${user?.quotas?.scansPerMonth || 30}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Questions IA</span>
                          <span className="font-medium text-gray-800">
                            {user?.currentUsage?.aiQuestionsToday || 0}
                            {user?.quotas?.aiQuestionsPerDay !== -1 && `/${user?.quotas?.aiQuestionsPerDay || 0}`}
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        <NavLink
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4 inline mr-2" />
                          Mon profil
                        </NavLink>
                        <NavLink
                          to="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4 inline mr-2" />
                          Parametres
                        </NavLink>
                        {user?.tier !== 'premium' && (
                          <NavLink
                            to="/premium"
                            className="block px-4 py-2 text-sm text-forest-dark hover:bg-primary-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Crown className="w-4 h-4 inline mr-2" />
                            Passer Premium
                          </NavLink>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4 inline mr-2" />
                          Deconnexion
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Header Mobile */}
      <header className="bg-white shadow-sm sticky top-0 z-50 md:hidden">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center space-x-2">
              <span className="text-2xl">a</span>
              <span className="text-lg font-bold text-gray-800">ECOLOJIA</span>
            </NavLink>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-gray-50"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="border-t border-gray-200">
            <div className="px-2 py-3 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium ${
                      isActive ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                  onClick={() => setShowMobileMenu(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {item.premium && user?.tier !== 'premium' && (
                    <Crown className="w-4 h-4 text-primary-1000 ml-auto" />
                  )}
                </NavLink>
              ))}

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
                <NavLink
                  to="/profile"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="w-5 h-5" />
                  <span>Mon profil</span>
                </NavLink>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Deconnexion</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Bottom navigation (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="grid grid-cols-5 h-16">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-green-700' : 'text-neutral-700'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Accueil</span>
          </NavLink>
          
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-green-700' : 'text-neutral-700'
              }`
            }
          >
            <Search className="w-5 h-5" />
            <span className="text-xs">Recherche</span>
          </NavLink>
          
          <NavLink
            to="/scan"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 relative ${
                isActive ? 'text-green-700' : 'text-neutral-700'
              }`
            }
          >
            <div className="absolute -top-6 bg-green-500 rounded-full p-3 shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </NavLink>
          
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-green-700' : 'text-neutral-700'
              }`
            }
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">Dashboard</span>
          </NavLink>
          
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-green-700' : 'text-neutral-700'
              }`
            }
          >
            <History className="w-5 h-5" />
            <span className="text-xs">Historique</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}




