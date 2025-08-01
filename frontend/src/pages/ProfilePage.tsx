import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Calendar, Shield, Save } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    allergies: user?.preferences?.allergies || [],
    dietaryRestrictions: user?.preferences?.dietaryRestrictions || [],
    healthGoals: user?.preferences?.healthGoals || []
  });

  const handleSave = async () => {
    try {
      await updateProfile({
        name: formData.name,
        preferences: {
          allergies: formData.allergies,
          dietaryRestrictions: formData.dietaryRestrictions,
          healthGoals: formData.healthGoals
        }
      });
      setEditing(false);
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Mon Profil</h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Informations principales */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Informations personnelles</h2>
              <button
                onClick={() => editing ? handleSave() : setEditing(true)}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                {editing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                ) : (
                  'Modifier'
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 mr-2" />
                  Nom
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-gray-800">{user?.name}</p>
                )}
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </label>
                <p className="text-gray-800">{user?.email}</p>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Shield className="w-4 h-4 mr-2" />
                  Statut
                </label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  user?.tier === 'premium' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user?.tier === 'premium' ? 'Premium' : 'Gratuit'}
                </span>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Membre depuis
                </label>
                <p className="text-gray-800">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Préférences alimentaires */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Préférences alimentaires</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Allergies
                </label>
                {editing ? (
                  <input
                    type="text"
                    placeholder="Gluten, Lactose, Arachides... (séparés par des virgules)"
                    value={formData.allergies.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      allergies: e.target.value.split(',').map(a => a.trim()).filter(a => a)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
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
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Régimes alimentaires
                </label>
                {editing ? (
                  <input
                    type="text"
                    placeholder="Végétarien, Vegan, Sans gluten... (séparés par des virgules)"
                    value={formData.dietaryRestrictions.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      dietaryRestrictions: e.target.value.split(',').map(d => d.trim()).filter(d => d)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;