// PATH: frontend/src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Home, Search, MessageCircle, ShoppingCart, BarChart3,
  Heart, History, User, Settings, LogOut, Crown, Leaf,
  Apple, Droplet, Sparkles
} from 'lucide-react';
import { useAuthContext } from '../../Contexts/AuthContext';
import { useQuota } from '../../hooks/useQuota';
import { useCategory } from '../../Contexts/CategoryContext';

const CATEGORIES = [
  { id: 'food', label: 'Alimentaire', icon: Apple, color: 'text-green-600' },
  { id: 'cosmetics', label: 'Cosmetiques', icon: Sparkles, color: 'text-pink-600' },
  { id: 'detergents', label: 'Detergents', icon: Droplet, color: 'text-blue-600' }
] as const;

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthContext();
  const { quotas } = useQuota();
  const { category: activeCategory, setCategory: setActiveCategory } = useCategory();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const mainNavigation = [
    { name: 'Accueil', to: '/', icon: Home },
    { name: 'Rechercher', to: '/search', icon: Search },
    { name: 'Assistant IA', to: '/chat', icon: MessageCircle, requiresAuth: true },
    { name: 'Mes Courses', to: '/shopping-list', icon: ShoppingCart, requiresAuth: true },
    { name: 'Dashboard', to: '/dashboard', icon: BarChart3, requiresAuth: true }
  ];

  const secondaryNavigation = [
    { name: 'Favoris', to: '/favorites', icon: Heart, requiresAuth: true },
    { name: 'Historique', to: '/history', icon: History, requiresAuth: true }
  ];

  return (
    <aside className="hidden md:flex md:flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-40">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <Link to="/" className="flex items-center space-x-2">
          <Leaf className="h-8 w-8 text-green-500" />
          <span className="text-xl font-bold text-gray-800">ECOLOJIA</span>
        </Link>
      </div>

      {/* Category Switcher */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id as any);
                  navigate('/search');
                }}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-md transition-all ${
                  isActive
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? cat.color : 'text-gray-400'}`} />
                <span className={`text-xs mt-1 font-medium text-center leading-tight ${
                  isActive ? 'text-gray-800' : 'text-gray-500'
                }`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {mainNavigation
          .filter(item => !item.requiresAuth || isAuthenticated)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

        <div className="my-4 border-t border-gray-200 pt-4 space-y-1">
          {secondaryNavigation
            .filter(item => !item.requiresAuth || isAuthenticated)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4">
        {isAuthenticated ? (
          <>
            {quotas && (
              <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Scans restants</div>
                <div className="font-semibold text-gray-800">
                  {quotas.scansRemaining}/{user?.subscription?.tier === 'premium' ? '∞' : '30'}
                </div>
              </div>
            )}

            {user?.subscription?.tier === 'free' && (
              <Link
                to="/premium"
                className="flex items-center justify-center space-x-2 w-full px-3 py-2 mb-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-md transition-shadow"
              >
                <Crown className="h-4 w-4" />
                <span>Passer Premium</span>
              </Link>
            )}

            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.firstName?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.email}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <NavLink
                to="/profile"
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Mon profil</span>
              </NavLink>
              <NavLink
                to="/settings"
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Parametres</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Deconnexion</span>
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Link
              to="/login"
              className="block w-full text-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="block w-full text-center px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              S'inscrire
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};