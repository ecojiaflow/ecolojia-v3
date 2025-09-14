// PATH: frontend/src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Moon, Globe, Shield, CreditCard, LogOut,
  ChevronRight, Check, X, Info, Smartphone, Mail,
  Lock, Trash2, Download, Eye, EyeOff, Sun,
  AlertTriangle, HelpCircle
} from 'lucide-react';
import { useAuthContext } from '../Contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import api from '../services/apiClient';
import { API_CONFIG } from '../config/api.config';

interface Settings {
  notifications: {
    push: boolean;
    email: boolean;
    weeklyReport: boolean;
    productAlerts: boolean;
    marketingEmails: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    personalizedAds: boolean;
    publicProfile: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    compactMode: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
}

// Composant Switch personnalise
const Switch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-[#7DDE4A]' : 'bg-gray-300'
      }`}
    >
      <motion.div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
        animate={{ left: checked ? 26 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
};

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      push: true,
      email: false,
      weeklyReport: true,
      productAlerts: true,
      marketingEmails: false
    },
    privacy: {
      shareAnalytics: true,
      personalizedAds: false,
      publicProfile: false
    },
    appearance: {
      theme: 'light',
      language: 'fr',
      compactMode: false
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30
    }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await api.get(`${API_CONFIG.ENDPOINTS.USER.PREFERENCES}`);
      if (userSettings) {
        setSettings(userSettings);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await api.put(API_CONFIG.ENDPOINTS.USER.PREFERENCES, settings);
      
      // Afficher une notification de succes
      alert('Parametres sauvegardes avec succes !');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Erreur lors de la sauvegarde des parametres');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â tes-vous sÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»r de vouloir vous deconnecter ?')) {
      await logout();
      navigate('/');
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await authService.changePassword(passwords.current, passwords.new);
      setShowPasswordModal(false);
      setPasswords({ current: '', new: '', confirm: '' });
      alert('Mot de passe modifie avec succes !');
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de mot de passe');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete(API_CONFIG.ENDPOINTS.GDPR.DELETE_ACCOUNT);
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Erreur lors de la suppression du compte');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await api.get(
        API_CONFIG.ENDPOINTS.GDPR.DOWNLOAD_DATA,
        { responseType: 'blob' }
      );
      
      // Telecharger le fichier
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mes-donnees-ecoloji?.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Erreur lors de l\'export des donnees');
    }
  };

  const updateSetting = (category: keyof Settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7DDE4A] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Chargement des parametres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F4]">
      {/* Header */}
      <div className="bg-white border-b border-[#DDE9DA]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-[#3B3B3B]">Parametres</h1>
          <p className="text-gray-600 mt-1">Gerez vos preferences et la securite de votre compte</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-[#DDE9DA] overflow-hidden"
        >
          <div className="p-6 border-b border-[#DDE9DA]">
            <h2 className="text-xl font-semibold text-[#3B3B3B] flex items-center">
              <Bell className="w-5 h-5 mr-3 text-[#7DDE4A]" />
              Notifications
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <span className="text-[#3B3B3B] font-medium">Notifications push</span>
                <p className="text-sm text-gray-600 mt-1">Recevez des alertes sur vos produits scannes</p>
              </div>
              <Switch
                checked={settings.notifications.push}
                onChange={(checked) => updateSetting('notifications', 'push', checked)}
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <span className="text-[#3B3B3B] font-medium">Emails de mise Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour</span>
                <p className="text-sm text-gray-600 mt-1">Nouvelles fonctionnalites et ameliorations</p>
              </div>
              <Switch
                checked={settings.notifications.email}
                onChange={(checked) => updateSetting('notifications', 'email', checked)}
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <span className="text-[#3B3B3B] font-medium">Rapport hebdomadaire</span>
                <p className="text-sm text-gray-600 mt-1">Resume de vos analyses et progres</p>
              </div>
              <Switch
                checked={settings.notifications.weeklyReport}
                onChange={(checked) => updateSetting('notifications', 'weeklyReport', checked)}
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <span className="text-[#3B3B3B] font-medium">Alertes produits</span>
                <p className="text-sm text-gray-600 mt-1">Notifications sur les rappels et mises Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  jour</p>
              </div>
              <Switch
                checked={settings.notifications.productAlerts}
                onChange={(checked) => updateSetting('notifications', 'productAlerts', checked)}
              />
            </label>
          </div>
        </motion.div>

        {/* Apparence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-[#DDE9DA] overflow-hidden"
        >
          <div className="p-6 border-b border-[#DDE9DA]">
            <h2 className="text-xl font-semibold text-[#3B3B3B] flex items-center">
              <Sun className="w-5 h-5 mr-3 text-[#7DDE4A]" />
              Apparence
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[#3B3B3B] font-medium mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light', label: 'Clair', icon: <Sun className="w-4 h-4" /> },
                  { value: 'dark', label: 'Sombre', icon: <Moon className="w-4 h-4" /> },
                  { value: 'auto', label: 'Auto', icon: <Smartphone className="w-4 h-4" /> }
                ].map(theme => (
                  <button
                    key={theme.value}
                    onClick={() => updateSetting('appearance', 'theme', theme.value)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      settings.appearance.theme === theme.value
                        ? 'border-[#7DDE4A] bg-[#E9F8DF]'
                        : 'border-[#DDE9DA] hover:border-gray-300'
                    }`}
                  >
                    {theme.icon}
                    <span className="font-medium">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-[#3B3B3B] font-medium mb-2">Langue</label>
              <select
                value={settings.appearance.language}
                onChange={(e) => updateSetting('appearance', 'language', e.target.value)}
                className="w-full px-4 py-3 border border-[#DDE9DA] rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
              >
                <option value="fr">Francais</option>
                <option value="en">English</option>
                <option value="es">EspaÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±ol</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <span className="text-[#3B3B3B] font-medium">Mode compact</span>
                <p className="text-sm text-gray-600 mt-1">Affichage condense pour plus d'informations</p>
              </div>
              <Switch
                checked={settings.appearance.compactMode}
                onChange={(checked) => updateSetting('appearance', 'compactMode', checked)}
              />
            </label>
          </div>
        </motion.div>

        {/* Confidentialite */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-[#DDE9DA] overflow-hidden"
        >
          <div className="p-6 border-b border-[#DDE9DA]">
            <h2 className="text-xl font-semibold text-[#3B3B3B] flex items-center">
              <Shield className="w-5 h-5 mr-3 text-[#7DDE4A]" />
              Confidentialite
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <span className="text-[#3B3B3B] font-medium">Partager les analyses anonymes</span>
                <p className="text-sm text-gray-600 mt-1">Aidez Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  ameliorer notre base de donnees</p>
              </div>
              <Switch
                checked={settings.privacy.shareAnalytics}
                onChange={(checked) => updateSetting('privacy', 'shareAnalytics', checked)}
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <span className="text-[#3B3B3B] font-medium">Publicites personnalisees</span>
                <p className="text-sm text-gray-600 mt-1">Afficher des publicites selon vos interets</p>
              </div>
              <Switch
                checked={settings.privacy.personalizedAds}
                onChange={(checked) => updateSetting('privacy', 'personalizedAds', checked)}
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <span className="text-[#3B3B3B] font-medium">Profil public</span>
                <p className="text-sm text-gray-600 mt-1">Permettre aux autres de voir vos statistiques</p>
              </div>
              <Switch
                checked={settings.privacy.publicProfile}
                onChange={(checked) => updateSetting('privacy', 'publicProfile', checked)}
              />
            </label>
            
            <div className="pt-4 border-t border-[#DDE9DA]">
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 text-[#7DDE4A] hover:text-[#6bc93a] font-medium"
              >
                <Download className="w-4 h-4" />
                Telecharger mes donnees (RGPD)
              </button>
            </div>
          </div>
        </motion.div>

        {/* Securite */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-[#DDE9DA] overflow-hidden"
        >
          <div className="p-6 border-b border-[#DDE9DA]">
            <h2 className="text-xl font-semibold text-[#3B3B3B] flex items-center">
              <Lock className="w-5 h-5 mr-3 text-[#7DDE4A]" />
              Securite
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#E9F8DF] rounded-lg">
              <div>
                <h4 className="font-medium text-[#3B3B3B]">Authentification Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  deux facteurs</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {settings.security.twoFactorEnabled 
                    ? 'Votre compte est protege par 2FA'
                    : 'Ajoutez une couche de securite supplementaire'
                  }
                </p>
              </div>
              <button className={`px-4 py-2 rounded-lg font-medium transition-all ${
                settings.security.twoFactorEnabled
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-[#7DDE4A] text-white hover:bg-[#6bc93a]'
              }`}>
                {settings.security.twoFactorEnabled ? 'Desactiver' : 'Activer'}
              </button>
            </div>
            
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-[#3B3B3B]">Changer le mot de passe</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <div>
              <label className="block text-[#3B3B3B] font-medium mb-2">
                Expiration de session (minutes)
              </label>
              <select
                value={settings.security.sessionTimeout}
                onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-[#DDE9DA] rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 heure</option>
                <option value={120}>2 heures</option>
                <option value={-1}>Jamais</option>
              </select>
            </div>
            
            <div className="pt-4 border-t border-[#DDE9DA] space-y-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Se deconnecter
              </button>
              
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer mon compte
              </button>
            </div>
          </div>
        </motion.div>

        {/* Abonnement */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-[#DDE9DA] overflow-hidden"
          >
            <div className="p-6 border-b border-[#DDE9DA]">
              <h2 className="text-xl font-semibold text-[#3B3B3B] flex items-center">
                <CreditCard className="w-5 h-5 mr-3 text-[#7DDE4A]" />
                Abonnement
              </h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-[#3B3B3B]">
                    Plan {user?.tier === 'premium' ? 'Premium' : user?.tier === 'family' ? 'Famille' : 'Gratuit'}
                  </h3>
                  <p className="text-gray-600">
                    {user?.tier === 'free' 
                      ? `${user?.quotas?.scansUsed || 0} / ${user?.quotas?.scansLimit || 30} analyses ce mois`
                      : 'Analyses illimitees'
                    }
                  </p>
                </div>
                
                {user?.tier === 'free' ? (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="px-4 py-2 bg-[#7DDE4A] text-white rounded-lg hover:bg-[#6bc93a] transition-all"
                  >
                    Passer Premium
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
                    Gerer l'abonnement
                  </button>
                )}
              </div>
              
              {user?.tier !== 'free' && (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Prochaine facturation : 1er du mois prochain</p>
                  <p>Methode de paiement : aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ 4242</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Bouton sauvegarder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end"
        >
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 bg-[#7DDE4A] text-white rounded-full font-semibold hover:bg-[#6bc93a] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Sauvegarder les modifications
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* Modal changement mot de passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-[#3B3B3B] mb-6">
              Changer le mot de passe
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full px-4 py-2 border border-[#DDE9DA] rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full px-4 py-2 border border-[#DDE9DA] rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full px-4 py-2 border border-[#DDE9DA] rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswords({ current: '', new: '', confirm: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-2 bg-[#7DDE4A] text-white rounded-lg hover:bg-[#6bc93a] transition-all"
              >
                Modifier
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal suppression compte */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#3B3B3B] mb-2">
                Supprimer votre compte ?
              </h3>
              <p className="text-gray-600">
                Cette action est irreversible. Toutes vos donnees seront definitivement supprimees.
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-red-800 mb-2">Vous allez perdre :</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Toutes vos analyses de produits</li>
                <li>aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Vos favoris et listes personnalisees</li>
                <li>aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Votre historique et statistiques</li>
                <li>aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Votre abonnement actif</li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Supprimer definitivement
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;


