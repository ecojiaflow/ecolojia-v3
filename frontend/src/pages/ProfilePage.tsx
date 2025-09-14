// PATH: frontend/src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Shield, 
  LogOut,
  Settings,
  ChevronRight,
  AlertCircle,
  Crown,
  Calendar,
  Globe,
  Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../Contexts/AuthContext';
import { userService } from '../services/api';
import { toast } from 'react-hot-toast';

interface UserPreferences {
  allergies: string[];
  diets: string[];
  healthGoals: string[];
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  language: 'fr' | 'en';
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    allergies: [],
    diets: [],
    healthGoals: [],
    notifications: {
      email: true,
      push: true,
      marketing: false
    },
    language: 'fr'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
      
      // Charger les préférences de l'utilisateur
      if (user.preferences) {
        setPreferences(user.preferences);
      }
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (false) {
      toast.success('Profil mis Ã  jour (mode démo)');
      setIsEditing(false);
      return;
    }

    try {
      setLoading(true);
      await userService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      toast.success('Profil mis Ã  jour avec succès');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de la mise Ã  jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (false) {
      toast.success('Mot de passe mis Ã  jour (mode démo)');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
      return;
    }

    try {
      setLoading(true);
      await userService.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      toast.success('Mot de passe mis Ã  jour avec succès');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Erreur lors de la mise Ã  jour du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async () => {
    if (false) {
      toast.success('Préférences mises Ã  jour (mode démo)');
      return;
    }

    try {
      setLoading(true);
      await userService.updatePreferences(preferences);
      toast.success('Préférences mises Ã  jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise Ã  jour des préférences');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const allergyOptions = [
    'Gluten', 'Lactose', 'Å’ufs', 'Fruits Ã  coque', 'Arachides', 
    'Soja', 'Poisson', 'Crustacés', 'Mollusques', 'Céleri',
    'Moutarde', 'Sésame', 'Sulfites', 'Lupin'
  ];

  const dietOptions = [
    'Végétarien', 'Végétalien', 'Sans gluten', 'Sans lactose',
    'Halal', 'Casher', 'Paléo', 'Keto', 'Méditerranéen'
  ];

  const healthGoalOptions = [
    'Perdre du poids', 'Prendre du muscle', 'Manger plus sainement',
    'Réduire le sucre', 'Augmenter les protéines', 'Plus de fibres',
    'Réduire le sel', 'Plus de vitamines'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-gray-600">{user?.email}</p>
                {user?.subscription?.tier === 'premium' && (
                  <div className="flex items-center gap-1 mt-1">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600 font-medium">Premium</span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profil
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('preferences')}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === 'preferences'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Préférences
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Sécurité
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Informations personnelles</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Modifier
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Membre depuis
                </label>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Janvier 2025'}</span>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>

            {/* Abonnement */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Abonnement</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {user?.subscription?.tier === 'premium' ? 'Premium' : 'Gratuit'}
                  </span>
                  {user?.subscription?.tier === 'free' && (
                    <button
                      onClick={() => navigate('/premium')}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      Passer Ã  Premium
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {user?.subscription?.tier === 'premium'
                    ? `Renouvellement le ${new Date(user.subscription.currentPeriodEnd || '').toLocaleDateString('fr-FR')}`
                    : '30 scans/mois â€¢ 5 chats IA/mois'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'preferences' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Allergies */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Allergies
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allergyOptions.map((allergy) => (
                  <label key={allergy} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.allergies.includes(allergy)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreferences({
                            ...preferences,
                            allergies: [...preferences.allergies, allergy]
                          });
                        } else {
                          setPreferences({
                            ...preferences,
                            allergies: preferences.allergies.filter(a => a !== allergy)
                          });
                        }
                      }}
                      className="text-green-500 rounded focus:ring-green-500"
                    />
                    <span className="text-sm">{allergy}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Régimes */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Régimes alimentaires
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dietOptions.map((diet) => (
                  <label key={diet} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.diets.includes(diet)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreferences({
                            ...preferences,
                            diets: [...preferences.diets, diet]
                          });
                        } else {
                          setPreferences({
                            ...preferences,
                            diets: preferences.diets.filter(d => d !== diet)
                          });
                        }
                      }}
                      className="text-green-500 rounded focus:ring-green-500"
                    />
                    <span className="text-sm">{diet}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Objectifs santé */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Objectifs santé</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {healthGoalOptions.map((goal) => (
                  <label key={goal} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.healthGoals.includes(goal)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreferences({
                            ...preferences,
                            healthGoals: [...preferences.healthGoals, goal]
                          });
                        } else {
                          setPreferences({
                            ...preferences,
                            healthGoals: preferences.healthGoals.filter(g => g !== goal)
                          });
                        }
                      }}
                      className="text-green-500 rounded focus:ring-green-500"
                    />
                    <span className="text-sm">{goal}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" />
                Notifications
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">Notifications par email</span>
                  <input
                    type="checkbox"
                    checked={preferences.notifications.email}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      notifications: { ...preferences.notifications, email: e.target.checked }
                    })}
                    className="text-green-500 rounded focus:ring-green-500"
                  />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">Notifications push</span>
                  <input
                    type="checkbox"
                    checked={preferences.notifications.push}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      notifications: { ...preferences.notifications, push: e.target.checked }
                    })}
                    className="text-green-500 rounded focus:ring-green-500"
                  />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">Communications marketing</span>
                  <input
                    type="checkbox"
                    checked={preferences.notifications.marketing}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      notifications: { ...preferences.notifications, marketing: e.target.checked }
                    })}
                    className="text-green-500 rounded focus:ring-green-500"
                  />
                </label>
              </div>
            </div>

            {/* Langue */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-500" />
                Langue
              </h3>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value as 'fr' | 'en' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>

            <button
              onClick={handleUpdatePreferences}
              disabled={loading}
              className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer les préférences'}
            </button>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Sécurité</h2>

            <div className="space-y-6">
              {/* Changement de mot de passe */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Changer le mot de passe</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleUpdatePassword}
                    disabled={loading || !formData.currentPassword || !formData.newPassword}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    {loading ? 'Mise Ã  jour...' : 'Mettre Ã  jour le mot de passe'}
                  </button>
                </div>
              </div>

              {/* Sessions actives */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Sessions actives</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Session actuelle</p>
                        <p className="text-sm text-gray-600">Connecté maintenant</p>
                      </div>
                    </div>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
              </div>

              {/* Suppression du compte */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Zone dangereuse</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-3">
                    La suppression de votre compte est irréversible. Toutes vos données seront définitivement supprimées.
                  </p>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    onClick={() => {
                      if (confirm('ÃŠtes-vous sÃ»r de vouloir supprimer votre compte ? Cette action est irréversible.')) {
                        toast.error('Fonctionnalité en cours de développement');
                      }
                    }}
                  >
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;