// PATH: frontend/src/components/profile/PreferencesTab.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, X, Info } from 'lucide-react';
import { Button } from '../common/Button';
import { Toggle } from '../common/Toggle';
import { Select } from '../common/Select';
import { Chip } from '../common/Chip';

interface PreferencesTabProps {
  userProfile: any;
  onUpdate: (updates: any) => void;
  isUpdating: boolean;
}

export function PreferencesTab({
  userProfile,
  onUpdate,
  isUpdating
}: PreferencesTabProps) {
  const [preferences, setPreferences] = useState(userProfile.aiPreferences || {});
  const [newRestriction, setNewRestriction] = useState('');
  const [newAllergen, setNewAllergen] = useState('');

  const toneOptions = [
    { value: 'concise', label: 'Concis', description: 'Reponses courtes et directes' },
    { value: 'detailed', label: 'Detaille', description: 'Analyses approfondies' },
    { value: 'educational', label: 'ducatif', description: 'Explications pedagogiques' },
    { value: 'friendly', label: 'Amical', description: 'Ton chaleureux et accessible' }
  ];

  const detailLevelOptions = [
    { value: 'minimal', label: 'Minimal', icon: '' },
    { value: 'moderate', label: 'Modere', icon: '' },
    { value: 'comprehensive', label: 'Complet', icon: '' }
  ];

  const foodRestrictionOptions = [
    'vegan', 'vegetarian', 'gluten-free', 'lactose-free',
    'halal', 'kosher', 'low-sodium', 'diabetic'
  ];

  const allergenOptions = [
    'peanuts', 'tree-nuts', 'milk', 'eggs', 'wheat',
    'soy', 'fish', 'shellfish', 'sesame'
  ];

  const handleSave = () => {
    onUpdate({ aiPreferences: preferences });
  };

  const addRestriction = (restriction: string) => {
    if (!preferences.foodRestrictions?.includes(restriction)) {
      setPreferences({
        ...preferences,
        foodRestrictions: [...(preferences.foodRestrictions || []), restriction]
      });
    }
  };

  const removeRestriction = (restriction: string) => {
    setPreferences({
      ...preferences,
      foodRestrictions: preferences.foodRestrictions?.filter(
        (r: string) => r !== restriction
      )
    });
  };

  const addAllergen = (allergen: string) => {
    if (!preferences.allergens?.includes(allergen)) {
      setPreferences({
        ...preferences,
        allergens: [...(preferences.allergens || []), allergen]
      });
    }
  };

  const removeAllergen = (allergen: string) => {
    setPreferences({
      ...preferences,
      allergens: preferences.allergens?.filter((a: string) => ? !== allergen)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6 space-y-6"
    >
      {/* AI Tone */}
      <div>
        <h3 className="text-lg font-semibold text-[#3B3B3B] mb-1">
          Ton des reponses IA
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Choisissez comment l'assistant IA communique avec vous
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {toneOptions.map((option) => (
            <button
              key={option.value}
              onClick={() =>
                setPreferences({ ...preferences, tone: option.value })
              }
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                preferences.tone === option.value ? 'border-[#7DDE4A] bg-[#E9F8DF]'
                  : 'border-[#DDE9DA] hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-[#3B3B3B]">{option.label}</p>
                  <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                </div>
                {preferences.tone === option.value && (
                  <Check className="w-5 h-5 text-[#7DDE4A] flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail Level */}
      <div>
        <h3 className="text-lg font-semibold text-[#3B3B3B] mb-1">
          Niveau de detail
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Controlez la profondeur des analyses
        </p>
        <div className="flex gap-3">
          {detailLevelOptions.map((option) => (
            <button
              key={option.value}
              onClick={() =>
                setPreferences({ ...preferences, detailLevel: option.value })
              }
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                preferences.detailLevel === option.value ? 'border-[#7DDE4A] bg-[#E9F8DF]'
                  : 'border-[#DDE9DA] hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <span className="text-2xl mb-2">{option.icon}</span>
                <p className="font-medium text-[#3B3B3B]">{option.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Food Restrictions */}
      <div>
        <h3 className="text-lg font-semibold text-[#3B3B3B] mb-1">
          Restrictions alimentaires
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Nous prendrons en compte ces restrictions dans nos analyses
        </p>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {preferences.foodRestrictions?.map((restriction: string) => (
              <Chip
                key={restriction}
                onRemove={() => removeRestriction(restriction)}
                variant="success"
              >
                {restriction.replace('-', ' ')}
              </Chip>
            ))}
          </div>
          <Select
            value={newRestriction}
            onChange={(e) => {
              addRestriction(e.target.value);
              setNewRestriction('');
            }}
            className="max-w-xs"
          >
            <option value="">Ajouter une restriction...</option>
            {foodRestrictionOptions
              .filter((opt) => !preferences.foodRestrictions?.includes(opt))
              .map((opt) => (
                <option key={opt} value={opt}>
                  {opt.replace('-', ' ')}
                </option>
              ))}
          </Select>
        </div>
      </div>

      {/* Allergens */}
      <div>
        <h3 className="text-lg font-semibold text-[#3B3B3B] mb-1">Allergenes</h3>
        <p className="text-sm text-gray-500 mb-4">
          Nous vous alerterons en priorite sur ces allergenes
        </p>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {preferences.allergens?.map((allergen: string) => (
              <Chip
                key={allergen}
                onRemove={() => removeAllergen(allergen)}
                variant="error"
              >
                {allergen}
              </Chip>
            ))}
          </div>
          <Select
            value={newAllergen}
            onChange={(e) => {
              addAllergen(e.target.value);
              setNewAllergen('');
            }}
            className="max-w-xs"
          >
            <option value="">Ajouter un allergene...</option>
            {allergenOptions
              .filter((opt) => !preferences.allergens?.includes(opt))
              .map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
          </Select>
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h3 className="text-lg font-semibold text-[#3B3B3B] mb-4">
          Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#3B3B3B]">Alertes par email</p>
              <p className="text-sm text-gray-500">
                Recevez des alertes sur les rappels de produits
              </p>
            </div>
            <Toggle
              checked={preferences.notificationPreferences?.emailAlerts aa true}
              onChange={(checked) =>
                setPreferences({
                  ...preferences,
                  notificationPreferences: {
                    ...preferences.notificationPreferences,
                    emailAlerts: checked
                  }
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#3B3B3B]">Rappels de produits</p>
              <p className="text-sm text-gray-500">
                Alertes immediates pour les produits rappeles
              </p>
            </div>
            <Toggle
              checked={preferences.notificationPreferences?.productRecalls aa true}
              onChange={(checked) =>
                setPreferences({
                  ...preferences,
                  notificationPreferences: {
                    ...preferences.notificationPreferences,
                    productRecalls: checked
                  }
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#3B3B3B]">Resume hebdomadaire</p>
              <p className="text-sm text-gray-500">
                Recevez un resume de vos scans de la semaine
              </p>
            </div>
            <Toggle
              checked={preferences.notificationPreferences?.weeklyDigest aa false}
              onChange={(checked) =>
                setPreferences({
                  ...preferences,
                  notificationPreferences: {
                    ...preferences.notificationPreferences,
                    weeklyDigest: checked
                  }
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-[#DDE9DA]">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isUpdating}
          className="w-full md:w-auto"
        >
          {isUpdating ? 'Enregistrement...' : 'Enregistrer les preferences'}
        </Button>
      </div>
    </motion.div>
  );
}

