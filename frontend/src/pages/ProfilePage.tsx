// PATH: frontend/src/pages/ProfilePage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Shield, Bell, CreditCard, LogOut, ChevronDown, Check } from 'lucide-react';
import { useAuthContext } from '../Contexts/AuthContext';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { toast } from 'react-hot-toast';

interface UserProfile {
  profile: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    emailVerified: boolean;
    createdAt: string;
    lastLogin?: string;
  };
  plan: {
    code: 'free' | 'premium' | 'family';
    status: string;
    periodEnd?: string;
  };
  limits: {
    scansPerMonth: number;
    aiChatsPerMonth: number;
    exportPerMonth: number;
    favoritesMax: number;
  };
  usage: {
    scans: string;
    aiChats: string;
    exports: string;
    favorites: string;
    lastReset: string;
  };
  aiPreferences: {
    tone?: string;
    detailLevel?: string;
    language?: string;
    foodRestrictions?: string[];
    allergens?: string[];
    cosmeticPreferences?: {
      avoidIngredients?: string[];
      skinType?: string;
    };
    notificationPreferences?: {
      emailAlerts?: boolean;
      productRecalls?: boolean;
      weeklyDigest?: boolean;
    };
  };
}

function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'account' | 'preferences'>('account');
  const { logout } = useAuthContext();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: userProfile, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        console.log('Fetching user profile...');
        const token = localStorage.getItem('token');
        console.log('Token exists:', !!token);
        
        const response = await api.get('/users/me'); // Essayons l'ancien endpoint
        console.log('API Response:', response);
        
        // Si la reponse est directement l'objet user
        if (response.data && !response.data?.data && !response.data?.user) {
          // Adapter la structure pour correspondre Â  UserProfile
          const userData = response.data;
          return {
            profile: {
              id: userdata?._id || userdata?.id,
              email: userdata?.email,
              name: userdata?.name || userdata?.email.split('@')[0],
              avatar: userdata?.avatar,
              emailVerified: userdata?.emailVerified || false,
              createdAt: userdata?.createdAt,
              lastLogin: userdata?.lastLogin
            },
            plan: userdata?.subscription || {
              code: 'free',
              status: 'active',
              periodEnd: undefined
            },
            limits: userdata?.limits || {
              scansPerMonth: 30,
              aiChatsPerMonth: 5,
              exportPerMonth: 0,
              favoritesMax: 10
            },
            usage: userdata?.usage || {
              scans: '0/30',
              aiChats: '0/5',
              exports: '0/0',
              favorites: '0/10',
              lastReset: new Date().toISOString()
            },
            aiPreferences: userdata?.aiPreferences || {}
          };
        }
        
        // Si la structure est differente
        return response.data?.data || response.data?.user || response.data;
      } catch (error: any) {
        console.error('Error fetching user profile:', error);
        console.error('Error response:', error.response);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const response = await api.put('/users/v2/me', updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profil mis Â  jour avec succes');
    },
    onError: () => {
      toast.error('Erreur lors de la mise Â  jour');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement du profil</p>
          <Button onClick={() => window.location.reload()}>
            Reessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Aucune donnee de profil disponible</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[#E9F8DF] rounded-full flex items-center justify-center">
                {userProfile?.profile?.avatar ? (
                  <img
                    src={userProfile.profile.avatar}
                    alt={userProfile.profile.name || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-[#7DDE4A]" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#3B3B3B]">
                  {userProfile?.profile?.name || 'Utilisateur'}
                </h1>
                <p className="text-gray-500">{userProfile?.profile?.email || ''}</p>
              </div>
            </div>
            <Badge
              variant={userProfile?.plan?.code === 'free' ? 'default' : 'success'}
              className="text-sm"
            >
              {userProfile?.plan?.code?.toUpperCase() || 'FREE'}
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="border-b border-[#DDE9DA]">
            <div className="flex">
              <button
                onClick={() => setActiveTab('account')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'account'
                    ? 'text-[#7DDE4A] border-b-2 border-[#7DDE4A]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Compte</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'preferences'
                    ? 'text-[#7DDE4A] border-b-2 border-[#7DDE4A]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>IA & Preferences</span>
                </div>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'account' ? (
              <AccountTab
                key="account"
                userProfile={userProfile}
                onLogout={logout}
              />
            ) : (
              <PreferencesTab
                key="preferences"
                userProfile={userProfile}
                onUpdate={updateProfileMutation.mutate}
                isUpdating={updateProfileMutation.isLoading}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Account Tab Component
function AccountTab({
  userProfile,
  onLogout
}: {
  userProfile: UserProfile;
  onLogout: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6 space-y-6"
    >
      {/* Plan & Usage */}
      <div>
        <h3 className="text-lg font-semibold text-[#3B3B3B] mb-4">
          Abonnement & Utilisation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#E9F8DF] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Scans</span>
              <span className="text-sm font-medium">{userProfile?.usage?.scans || '0/30'}</span>
            </div>
            <div className="w-full bg-white rounded-full h-2">
              <div
                className="bg-[#7DDE4A] h-2 rounded-full transition-all"
                style={{
                  width: `${
                    userProfile?.usage?.scans
                      ? (parseInt(userProfile.usage.scans.split('/')[0]) /
                          parseInt(userProfile.usage.scans.split('/')[1])) *
                        100
                      : 0
                  }%`
                }}
              />
            </div>
          </div>
          <div className="bg-[#E9F8DF] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Chats IA</span>
              <span className="text-sm font-medium">{userProfile?.usage?.aiChats || '0/5'}</span>
            </div>
            <div className="w-full bg-white rounded-full h-2">
              <div
                className="bg-[#7DDE4A] h-2 rounded-full transition-all"
                style={{
                  width: `${
                    userProfile?.usage?.aiChats
                      ? (parseInt(userProfile.usage.aiChats.split('/')[0]) /
                          parseInt(userProfile.usage.aiChats.split('/')[1])) *
                        100
                      : 0
                  }%`
                }}
              />
            </div>
          </div>
        </div>
        {userProfile?.plan?.code === 'free' && (
          <div className="mt-4">
            <Button
              variant="primary"
              className="w-full md:w-auto"
              onClick={() => {
                // Navigate to pricing
                window.location.href = '/pricing';
              }}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Passer Â  Premium
            </Button>
          </div>
        )}
      </div>

      {/* Security */}
      <div>
        <h3 className="text-lg font-semibold text-[#3B3B3B] mb-4">Securite</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-[#DDE9DA]">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-[#3B3B3B]">Email verifie</p>
                <p className="text-sm text-gray-500">{userProfile?.profile?.email || ''}</p>
              </div>
            </div>
            {userProfile?.profile?.emailVerified ? (
              <Badge variant="success">Verifie</Badge>
            ) : (
              <Button variant="outline" size="small">
                Verifier
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-[#3B3B3B]">
                  Authentification Â  deux facteurs
                </p>
                <p className="text-sm text-gray-500">
                  Securisez votre compte avec la 2FA
                </p>
              </div>
            </div>
            <Button variant="outline" size="small">
              Configurer
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-[#DDE9DA]">
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Se deconnecter
        </Button>
      </div>
    </motion.div>
  );
}

// Preferences Tab Component
function PreferencesTab({
  userProfile,
  onUpdate,
  isUpdating
}: {
  userProfile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
  isUpdating: boolean;
}) {
  const [preferences, setPreferences] = useState(userProfile?.aiPreferences || {});
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    onUpdate({ aiPreferences: preferences });
    setHasChanges(false);
  };

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6 space-y-6"
    >
      {/* AI Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-[#3B3B3B] mb-4">
          Preferences de l'IA
        </h3>
        <div className="space-y-4">
          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ton de l'assistant
            </label>
            <select
              value={preferences.tone || 'friendly'}
              onChange={(e) => updatePreference('tone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7DDE4A]"
            >
              <option value="friendly">Amical</option>
              <option value="professional">Professionnel</option>
              <option value="concise">Concis</option>
              <option value="detailed">Detaille</option>
            </select>
          </div>

          {/* Detail Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Niveau de detail
            </label>
            <select
              value={preferences.detailLevel || 'balanced'}
              onChange={(e) => updatePreference('detailLevel', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7DDE4A]"
            >
              <option value="minimal">Minimal</option>
              <option value="balanced">â€°quilibre</option>
              <option value="comprehensive">Complet</option>
            </select>
          </div>

          {/* Food Restrictions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restrictions alimentaires
            </label>
            <div className="space-y-2">
              {['vegan', 'vegetarian', 'gluten-free', 'dairy-free'].map((restriction) => (
                <label key={restriction} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.foodRestrictions?.includes(restriction) || false}
                    onChange={(e) => {
                      const current = preferences.foodRestrictions || [];
                      if (e.target.checked) {
                        updatePreference('foodRestrictions', [...current, restriction]);
                      } else {
                        updatePreference('foodRestrictions', current.filter(r => r !== restriction));
                      }
                    }}
                    className="mr-2 text-[#7DDE4A] focus:ring-[#7DDE4A]"
                  />
                  <span className="text-sm">
                    {restriction === 'vegan' && 'Vegan'}
                    {restriction === 'vegetarian' && 'Vegetarien'}
                    {restriction === 'gluten-free' && 'Sans gluten'}
                    {restriction === 'dairy-free' && 'Sans lactose'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h3 className="text-lg font-semibold text-[#3B3B3B] mb-4">
          Notifications
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Alertes email</span>
            <input
              type="checkbox"
              checked={preferences.notificationPreferences?.emailAlerts || false}
              onChange={(e) => updatePreference('notificationPreferences', {
                ...preferences.notificationPreferences,
                emailAlerts: e.target.checked
              })}
              className="text-[#7DDE4A] focus:ring-[#7DDE4A]"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Rappels de produits</span>
            <input
              type="checkbox"
              checked={preferences.notificationPreferences?.productRecalls || false}
              onChange={(e) => updatePreference('notificationPreferences', {
                ...preferences.notificationPreferences,
                productRecalls: e.target.checked
              })}
              className="text-[#7DDE4A] focus:ring-[#7DDE4A]"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="pt-4 border-t border-[#DDE9DA]">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isUpdating}
            className="w-full md:w-auto"
          >
            {isUpdating ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default ProfilePage;

