// PATH: frontend/src/pages/AiPreferencesPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, MessageSquare, Globe, Focus, Utensils, 
  AlertTriangle, History, Lightbulb, ChevronLeft,
  Sparkles, Book, Smile, GraduationCap, Save, Check
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { motion } from 'framer-motion';

interface AiPreferences {
  tone: 'casual' | 'professional' | 'educational' | 'fun';
  detail: 'concise' | 'balanced' | 'detailed';
  language: 'fr' | 'en' | 'es' | 'de' | 'it';
  focusAreas: string[];
  foodRestrictions: string[];
  allergies: string[];
  autoSuggest: boolean;
  saveHistory: boolean;
}

interface ToneOption {
  value: AiPreferences['tone'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface DetailOption {
  value: AiPreferences['detail'];
  label: string;
  description: string;
}

const AiPreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiPrefs, setAiPrefs] = useState<AiPreferences>({
    tone: 'educational',
    detail: 'balanced',
    language: 'fr',
    focusAreas: [],
    foodRestrictions: [],
    allergies: [],
    autoSuggest: true,
    saveHistory: true
  });

  const toneOptions: ToneOption[] = [
    { value: 'casual', label: 'DÃƒÆ’Ã‚Â©contractÃƒÆ’Ã‚Â©', icon: Smile, description: 'RÃƒÆ’Ã‚Â©ponses simples et amicales' },
    { value: 'professional', label: 'Professionnel', icon: Book, description: 'Analyses dÃƒÆ’Ã‚Â©taillÃƒÆ’Ã‚Â©es et formelles' },
    { value: 'educational', label: 'ÃƒÆ’Ã¢â‚¬Â°ducatif', icon: GraduationCap, description: 'Explications pÃƒÆ’Ã‚Â©dagogiques' },
    { value: 'fun', label: 'Ludique', icon: Sparkles, description: 'Ton lÃƒÆ’Ã‚Â©ger avec emojis' }
  ];

  const detailOptions: DetailOption[] = [
    { value: 'concise', label: 'Concis', description: 'L\'essentiel en quelques mots' },
    { value: 'balanced', label: 'ÃƒÆ’Ã¢â‚¬Â°quilibrÃƒÆ’Ã‚Â©', description: 'Informations complÃƒÆ’Ã‚Â¨tes mais accessibles' },
    { value: 'detailed', label: 'DÃƒÆ’Ã‚Â©taillÃƒÆ’Ã‚Â©', description: 'Analyses approfondies avec sources' }
  ];

  const focusAreaOptions = [
    { value: 'health', label: 'SantÃƒÆ’Ã‚Â©', icon: 'Ã¢Ã‚ÂÃ‚Â¤ÃƒÂ¯Ã‚Â¸Ã‚Â' },
    { value: 'environment', label: 'Environnement', icon: 'ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â' },
    { value: 'ethics', label: 'ÃƒÆ’Ã¢â‚¬Â°thique', icon: 'Ã¢Ã…Â¡Ã¢â‚¬â€œÃƒÂ¯Ã‚Â¸Ã‚Â' },
    { value: 'allergies', label: 'Allergies', icon: 'Ã¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â' },
    { value: 'nutrition', label: 'Nutrition', icon: 'ÃƒÂ°Ã…Â¸Ã‚Â¥Ã¢â‚¬â€' }
  ];

  const restrictionOptions = [
    { value: 'vegan', label: 'VÃƒÆ’Ã‚Â©gane', icon: 'ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â±' },
    { value: 'vegetarian', label: 'VÃƒÆ’Ã‚Â©gÃƒÆ’Ã‚Â©tarien', icon: 'ÃƒÂ°Ã…Â¸Ã‚Â¥Ã¢â‚¬Â¢' },
    { value: 'gluten-free', label: 'Sans gluten', icon: 'ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â¾' },
    { value: 'lactose-free', label: 'Sans lactose', icon: 'ÃƒÂ°Ã…Â¸Ã‚Â¥Ã¢â‚¬Âº' },
    { value: 'halal', label: 'Halal', icon: 'Ã¢Ã‹Å“Ã‚ÂªÃƒÂ¯Ã‚Â¸Ã‚Â' },
    { value: 'kosher', label: 'Casher', icon: 'Ã¢Ã…â€œÃ‚Â¡ÃƒÂ¯Ã‚Â¸Ã‚Â' },
    { value: 'nut-free', label: 'Sans fruits ÃƒÆ’Ã‚Â  coque', icon: 'ÃƒÂ°Ã…Â¸Ã‚Â¥Ã…â€œ' }
  ];

  useEffect(() => {
    fetchPreferences();
  }, []);

    const fetchPreferences = async () => {
    try {
      // VÃ©rifier si l'utilisateur est connectÃ©
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, redirecting to login');
        navigate('/login');
        return;
      }
      
      const response = await api.get('/users/v2/me');
      if (response.data.user.aiPrefs) {
        setAiPrefs(response.data.user.aiPrefs);
      }
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      if (error.message === 'Token non fourni' || error.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Erreur lors du chargement des prÃ©fÃ©rences');
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put('/users/v2/me/ai-preferences', aiPrefs);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (array: keyof Pick<AiPreferences, 'focusAreas' | 'foodRestrictions' | 'allergies'>, item: string) => {
    setAiPrefs(prev => ({
      ...prev,
      [array]: prev[array].includes(item)
        ? prev[array].filter(i => i !== item)
        : [...prev[array], item]
    }));
  };

  const handleAddAllergy = () => {
    const allergy = prompt('Ajouter une allergie :');
    if (allergy && !aiPrefs.allergies.includes(allergy)) {
      setAiPrefs({ ...aiPrefs, allergies: [...aiPrefs.allergies, allergy] });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#F7F9F4]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/profile')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#3B3B3B]">PrÃƒÆ’Ã‚Â©fÃƒÆ’Ã‚Â©rences IA</h1>
                <p className="text-gray-600 mt-1">Personnalisez votre assistant Ecolojia</p>
              </div>
            </div>
            <Brain className="w-8 h-8 text-[#7DDE4A]" />
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        </div>
      )}
      
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto px-4 mt-4"
        >
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <Check className="w-5 h-5" />
            PrÃƒÆ’Ã‚Â©fÃƒÆ’Ã‚Â©rences mises ÃƒÆ’Ã‚Â  jour avec succÃƒÆ’Ã‚Â¨s !
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ton de l'IA */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3B3B3B] mb-1 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#7DDE4A]" />
            Ton de l'assistant
          </h2>
          <p className="text-gray-600 mb-4">Comment souhaitez-vous que l'IA vous rÃƒÆ’Ã‚Â©ponde ?</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {toneOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setAiPrefs({ ...aiPrefs, tone: option.value })}
                className={`p-4 rounded-xl border-2 transition text-left ${
                  aiPrefs.tone === option.value
                    ? 'border-[#7DDE4A] bg-[#E9F8DF]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <option.icon className="w-5 h-5 text-gray-700 mt-0.5" />
                  <div>
                    <div className="font-medium text-[#3B3B3B]">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Niveau de dÃƒÆ’Ã‚Â©tail */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3B3B3B] mb-1 flex items-center gap-2">
            <Book className="w-5 h-5 text-blue-500" />
            Niveau de dÃƒÆ’Ã‚Â©tail
          </h2>
          <p className="text-gray-600 mb-4">Quelle quantitÃƒÆ’Ã‚Â© d'informations souhaitez-vous recevoir ?</p>
          
          <div className="space-y-3">
            {detailOptions.map(option => (
              <label
                key={option.value}
                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition ${
                  aiPrefs.detail === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="detail"
                  value={option.value}
                  checked={aiPrefs.detail === option.value}
                  onChange={(e) => setAiPrefs({ ...aiPrefs, detail: e.target.value as AiPreferences['detail'] })}
                  className="sr-only"
                />
                <div>
                  <div className="font-medium text-[#3B3B3B]">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Domaines d'intÃƒÆ’Ã‚Â©rÃƒÆ’Ã‚Âªt */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3B3B3B] mb-1 flex items-center gap-2">
            <Focus className="w-5 h-5 text-purple-500" />
            Domaines d'intÃƒÆ’Ã‚Â©rÃƒÆ’Ã‚Âªt
          </h2>
          <p className="text-gray-600 mb-4">Sur quoi l'IA doit-elle se concentrer en prioritÃƒÆ’Ã‚Â© ?</p>
          
          <div className="flex flex-wrap gap-3">
            {focusAreaOptions.map(option => (
              <button
                key={option.value}
                onClick={() => toggleArrayItem('focusAreas', option.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition ${
                  aiPrefs.focusAreas.includes(option.value)
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span>{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Restrictions alimentaires */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3B3B3B] mb-1 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-orange-500" />
            RÃƒÆ’Ã‚Â©gime alimentaire
          </h2>
          <p className="text-gray-600 mb-4">L'IA prendra en compte ces restrictions dans ses recommandations</p>
          
          <div className="flex flex-wrap gap-3">
            {restrictionOptions.map(option => (
              <button
                key={option.value}
                onClick={() => toggleArrayItem('foodRestrictions', option.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition ${
                  aiPrefs.foodRestrictions.includes(option.value)
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span>{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3B3B3B] mb-1 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Allergies
          </h2>
          <p className="text-gray-600 mb-4">L'IA vous alertera systÃƒÆ’Ã‚Â©matiquement sur ces allergÃƒÆ’Ã‚Â¨nes</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {aiPrefs.allergies.map((allergy, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full"
              >
                {allergy}
                <button
                  onClick={() => setAiPrefs({
                    ...aiPrefs,
                    allergies: aiPrefs.allergies.filter((_, i) => i !== index)
                  })}
                  className="ml-1 hover:text-red-900"
                >
                  ÃƒÆ’Ã¢â‚¬â€
                </button>
              </span>
            ))}
          </div>
          
          <button
            onClick={handleAddAllergy}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            + Ajouter une allergie
          </button>
        </div>

        {/* Options avancÃƒÆ’Ã‚Â©es */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3B3B3B] mb-4">Options avancÃƒÆ’Ã‚Â©es</h2>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="font-medium text-[#3B3B3B]">Suggestions automatiques</div>
                  <div className="text-sm text-gray-600">L'IA propose des questions pertinentes</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={aiPrefs.autoSuggest}
                onChange={(e) => setAiPrefs({ ...aiPrefs, autoSuggest: e.target.checked })}
                className="w-5 h-5 text-[#7DDE4A] rounded focus:ring-[#7DDE4A]"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-[#3B3B3B]">Historique des conversations</div>
                  <div className="text-sm text-gray-600">Conserver vos ÃƒÆ’Ã‚Â©changes avec l'IA</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={aiPrefs.saveHistory}
                onChange={(e) => setAiPrefs({ ...aiPrefs, saveHistory: e.target.checked })}
                className="w-5 h-5 text-[#7DDE4A] rounded focus:ring-[#7DDE4A]"
              />
            </label>
          </div>
        </div>

        {/* Langue */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-[#3B3B3B] mb-1 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            Langue
          </h2>
          <p className="text-gray-600 mb-4">Dans quelle langue souhaitez-vous communiquer ?</p>
          
          <select
            value={aiPrefs.language}
            onChange={(e) => setAiPrefs({ ...aiPrefs, language: e.target.value as AiPreferences['language'] })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="fr">ÃƒÂ°Ã…Â¸Ã¢â‚¬Â¡Ã‚Â«ÃƒÂ°Ã…Â¸Ã¢â‚¬Â¡Ã‚Â· FranÃƒÆ’Ã‚Â§ais</option>
            <option value="en">ÃƒÂ°Ã…Â¸Ã¢â‚¬Â¡Ã‚Â¬ÃƒÂ°Ã…Â¸Ã¢â‚¬Â¡Ã‚Â§ English</option>
            <option value="es">ÃƒÂ°Ã…Â¸Ã¢â‚¬Â¡Ã‚ÂªÃƒÂ°Ã…Â¸Ã¢â‚¬Â¡Ã‚Â¸ EspaÃƒÆ’Ã‚Â±ol</option>
            <option value="de">ÃƒÂ°Ã…Â¸Ã¢â‚¬Â¡Ã‚Â©ÃƒÂ°Ã…Â¸Ã¢â‚¬Â¡Ã‚Âª Deutsch</option>
            <option value="it">ÃƒÂ°Ã…Â¸Ã¢â‚¬Â¡Ã‚Â®ÃƒÂ°Ã…Â¸Ã¢â‚¬Â¡Ã‚Â¹ Italiano</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#7DDE4A] to-[#6bc93a] text-white font-medium py-3 px-8 rounded-xl hover:from-[#6bc93a] hover:to-[#5ab82a] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer mes prÃƒÆ’Ã‚Â©fÃƒÆ’Ã‚Â©rences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiPreferencesPage;


