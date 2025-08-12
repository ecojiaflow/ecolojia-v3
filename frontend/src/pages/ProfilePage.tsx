// PATH: frontend/src/pages/ProfilePage.tsx
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Calendar, Shield, Save, Camera,
  Award, TrendingUp, Package, Heart, Edit3,
  Check, X, AlertCircle, Leaf, Star
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  allergies: string[];
  dietaryRestrictions: string[];
  healthGoals: string[];
}

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    email: user?.email || '',
    allergies: user?.preferences?.allergies || [],
    dietaryRestrictions: user?.preferences?.dietaryRestrictions || [],
    healthGoals: user?.preferences?.healthGoals || []
  });

  // Suggestions prédéfinies
  const allergySuggestions = ['Gluten', 'Lactose', 'Arachides', 'Oeufs', 'Soja', 'Fruits ÃƒÂ  coque', 'Poisson', 'Crustacés'];
  const dietSuggestions = ['Végétarien', 'Vegan', 'Sans gluten', 'Sans lactose', 'Halal', 'Casher', 'Paléo', 'Keto'];
  const goalSuggestions = ['Perdre du poids', 'Manger plus sain', 'Réduire le sucre', 'Plus de protéines', 'Manger bio', 'Réduire les additifs'];

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.updateProfile({
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          avatar: avatarPreview || undefined
        },
        preferences: {
          allergies: formData.allergies,
          dietaryRestrictions: formData.dietaryRestrictions,
          healthGoals: formData.healthGoals
        }
      });
      
      await refreshUser();
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise ÃƒÂ  jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      email: user?.email || '',
      allergies: user?.preferences?.allergies || [],
      dietaryRestrictions: user?.preferences?.dietaryRestrictions || [],
      healthGoals: user?.preferences?.healthGoals || []
    });
    setAvatarPreview(null);
    setEditing(false);
    setError(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleItem = (list: 'allergies' | 'dietaryRestrictions' | 'healthGoals', item: string) => {
    setFormData(prev => ({
      ...prev,
      [list]: prev[list].includes(item)
        ? prev[list].filter(i => i !== item)
        : [...prev[list], item]
    }));
  };

  const getMembershipDuration = () => {
    if (!user?.profile?.createdAt) return 'Nouveau membre';
    
    const createdDate = new Date(user.profile.createdAt);
    const now = new Date();
    const months = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (months < 1) return 'Membre depuis moins d\'un mois';
    if (months === 1) return 'Membre depuis 1 mois';
    return `Membre depuis ${months} mois`;
  };

  const getProfileCompletionPercentage = () => {
    let completed = 0;
    const fields = [
      user?.profile?.firstName,
      user?.profile?.lastName,
      user?.email,
      user?.emailVerified,
      user?.profile?.avatar,
      (user?.preferences?.allergies?.length || 0) > 0,
      (user?.preferences?.dietaryRestrictions?.length || 0) > 0,
      (user?.preferences?.healthGoals?.length || 0) > 0
    ];
    
    fields.forEach(field => {
      if (field) completed++;
    });
    
    return Math.round((completed / fields.length) * 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F7F9F4] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Veuillez vous connecter pour accéder ÃƒÂ  votre profil</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-3 bg-[#7DDE4A] text-white rounded-full hover:bg-[#6bc93a] transition-all"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F4]">
      {/* Header avec bannière */}
      <div className="bg-gradient-to-r from-[#7DDE4A] to-[#6bc93a] h-48 relative">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 h-full flex items-end pb-8">
          <div className="flex items-end gap-6 relative z-10">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 bg-white rounded-full p-1">
                {avatarPreview || user.profile?.avatar ? (
                  <img
                    src={avatarPreview || user.profile?.avatar}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#E9F8DF] rounded-full flex items-center justify-center">
                    <User className="w-16 h-16 text-[#7DDE4A]" />
                  </div>
                )}
              </div>
              
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
                >
                  <Camera className="w-5 h-5 text-gray-600" />
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            
            {/* Infos principales */}
            <div className="text-white pb-2">
              <h1 className="text-3xl font-bold mb-1">
                {user.profile?.firstName} {user.profile?.lastName}
              </h1>
              <p className="text-white/80">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 py-8 -mt-8">
        {/* Carte de statut */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#3B3B3B]">Informations du compte</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center px-4 py-2 bg-[#7DDE4A] text-white rounded-lg hover:bg-[#6bc93a] transition-all"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-[#7DDE4A] text-white rounded-lg hover:bg-[#6bc93a] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Profil mis ÃƒÂ  jour avec succès !
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prénom */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 mr-2" />
                Prénom
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDE9DA] rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
                />
              ) : (
                <p className="text-[#3B3B3B]">{user.profile?.firstName || '-'}</p>
              )}
            </div>
            
            {/* Nom */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 mr-2" />
                Nom
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DDE9DA] rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
                />
              ) : (
                <p className="text-[#3B3B3B]">{user.profile?.lastName || '-'}</p>
              )}
            </div>
            
            {/* Email */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </label>
              <p className="text-[#3B3B3B] flex items-center gap-2">
                {user.email}
                {user.emailVerified && (
                  <span className="text-green-600" title="Email vérifié">
                    <Check className="w-4 h-4" />
                  </span>
                )}
              </p>
            </div>
            
            {/* Statut */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Shield className="w-4 h-4 mr-2" />
                Statut
              </label>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                user.tier === 'premium' 
                  ? 'bg-gradient-to-r from-[#7DDE4A] to-[#6bc93a] text-white' 
                  : user.tier === 'family'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user.tier === 'premium' && <Star className="w-4 h-4" />}
                {user.tier === 'premium' ? 'Premium' : user.tier === 'family' ? 'Famille' : 'Gratuit'}
              </span>
            </div>
            
            {/* Membre depuis */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                Ancienneté
              </label>
              <p className="text-[#3B3B3B]">{getMembershipDuration()}</p>
            </div>
            
            {/* Progression profil */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                Profil complété
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#7DDE4A] h-2 rounded-full transition-all"
                    style={{ width: `${getProfileCompletionPercentage()}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{getProfileCompletionPercentage()}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Préférences alimentaires */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#3B3B3B] mb-4">Préférences alimentaires</h3>
          
          <div className="space-y-6">
            {/* Allergies */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Allergies et intolérances
              </label>
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {allergySuggestions.map(allergy => (
                    <button
                      key={allergy}
                      onClick={() => toggleItem('allergies', allergy)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        formData.allergies.includes(allergy)
                          ? 'bg-red-100 text-red-800 border-2 border-red-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {allergy}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user?.preferences?.allergies?.length ? (
                    user.preferences.allergies.map((allergy, index) => (
                      <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">Aucune allergie déclarée</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Régimes alimentaires */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Régimes alimentaires
              </label>
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {dietSuggestions.map(diet => (
                    <button
                      key={diet}
                      onClick={() => toggleItem('dietaryRestrictions', diet)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        formData.dietaryRestrictions.includes(diet)
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user?.preferences?.dietaryRestrictions?.length ? (
                    user.preferences.dietaryRestrictions.map((diet, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {diet}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">Aucun régime spécifique</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Objectifs santé */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Objectifs santé
              </label>
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {goalSuggestions.map(goal => (
                    <button
                      key={goal}
                      onClick={() => toggleItem('healthGoals', goal)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        formData.healthGoals.includes(goal)
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user?.preferences?.healthGoals?.length ? (
                    user.preferences.healthGoals.map((goal, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {goal}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">Aucun objectif défini</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques du compte */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-[#3B3B3B] mb-4">Statistiques du compte</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#E9F8DF] rounded-lg p-4 text-center">
              <Package className="w-8 h-8 text-[#7DDE4A] mx-auto mb-2" />
              <div className="text-2xl font-bold text-[#3B3B3B]">
                {user.quotas?.scansUsed || 0}
              </div>
              <p className="text-sm text-gray-600">Analyses effectuées</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-[#3B3B3B]">
                {user._stats?.favoritesCount || 0}
              </div>
              <p className="text-sm text-gray-600">Produits favoris</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-[#3B3B3B]">
                {user._stats?.badgesCount || 0}
              </div>
              <p className="text-sm text-gray-600">Badges obtenus</p>
            </div>
          </div>
        </div>

        {/* CTA Premium si utilisateur gratuit */}
        {user.tier === 'free' && (
          <div className="mt-6 bg-gradient-to-r from-[#7DDE4A] to-[#6bc93a] rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  Débloquez tout le potentiel d'ECOLOJIA
                </h3>
                <p className="text-white/90">
                  Analyses illimitées, chat IA nutritionniste, export de données et bien plus !
                </p>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="px-6 py-3 bg-white text-[#7DDE4A] rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Passer Premium
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
