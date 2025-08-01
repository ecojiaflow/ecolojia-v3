import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Bell, Moon, Globe, Shield, CreditCard, LogOut } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    notifications: user?.preferences?.notifications ?? true,
    emailUpdates: user?.preferences?.emailUpdates ?? false,
    theme: user?.preferences?.theme || 'light',
    language: user?.preferences?.language || 'fr'
  });

  const handleLogout = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Paramètres</h1>
        
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Notifications push</span>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Emails de mise à jour</span>
                <input
                  type="checkbox"
                  checked={settings.emailUpdates}
                  onChange={(e) => setSettings({ ...settings, emailUpdates: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
              </label>
            </div>
          </div>
          
          {/* Apparence */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Moon className="w-5 h-5 mr-2" />
              Apparence
            </h2>
            
            <div>
              <label className="block text-gray-700 mb-2">Thème</label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="auto">Automatique</option>
              </select>
            </div>
          </div>
          
          {/* Langue */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Langue
            </h2>
            
            <div>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          
          {/* Abonnement */}
          {user?.tier === 'free' && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Passer à Premium
              </h2>
              
              <p className="mb-4">
                Débloquez toutes les fonctionnalités avec un abonnement Premium
              </p>
              
              <button className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100">
                Voir les offres
              </button>
            </div>
          )}
          
          {/* Sécurité */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Sécurité
            </h2>
            
            <div className="space-y-4">
              <button className="text-green-600 hover:text-green-700 font-medium">
                Changer le mot de passe
              </button>
              
              <div className="pt-4 border-t">
                <button
                  onClick={handleLogout}
                  className="flex items-center text-red-600 hover:text-red-700 font-medium"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;