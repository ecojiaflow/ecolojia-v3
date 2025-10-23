// frontend/src/components/cosmetics/CertificationBadges.tsx

import React from 'react';
import { 
  Leaf, 
  Heart, 
  Rabbit, 
  Award,
  CheckCircle,
  ShieldCheck,
  Globe,
  Flower
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CertificationBadgesProps {
  certifications: string[];
  sizea: 'small' | 'medium' | 'large';
  showLabelsa: boolean;
}

interface CertificationInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const certificationData: Record<string, CertificationInfo> = {
  'cosmos_organic': {
    id: 'cosmos_organic',
    name: 'COSMOS Organic',
    description: 'Au moins 95% d\'ingredients biologiques',
    icon: <Leaf className="w-full h-full" />,
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  'cosmos_natural': {
    id: 'cosmos_natural',
    name: 'COSMOS Natural',
    description: 'Cosmetique naturel certifie',
    icon: <Flower className="w-full h-full" />,
    color: 'text-green-700',
    bgColor: 'bg-green-50'
  },
  'ecocert': {
    id: 'ecocert',
    name: 'Ecocert',
    description: 'Certification biologique et ecologique',
    icon: <Globe className="w-full h-full" />,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100'
  },
  'natrue': {
    id: 'natrue',
    name: 'NaTrue',
    description: 'Cosmetique naturel authentique',
    icon: <Leaf className="w-full h-full" />,
    color: 'text-lime-700',
    bgColor: 'bg-lime-100'
  },
  'bdih': {
    id: 'bdih',
    name: 'BDIH',
    description: 'Cosmetique naturel controle',
    icon: <ShieldCheck className="w-full h-full" />,
    color: 'text-teal-700',
    bgColor: 'bg-teal-100'
  },
  'leaping_bunny': {
    id: 'leaping_bunny',
    name: 'Leaping Bunny',
    description: 'Sans tests sur animaux',
    icon: <Rabbit className="w-full h-full" />,
    color: 'text-pink-700',
    bgColor: 'bg-pink-100'
  },
  'cruelty_free': {
    id: 'cruelty_free',
    name: 'Cruelty Free',
    description: 'Non teste sur les animaux',
    icon: <Heart className="w-full h-full" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  'vegan': {
    id: 'vegan',
    name: 'Vegan',
    description: 'Sans ingredient d\'origine animale',
    icon: <Leaf className="w-full h-full" />,
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  'organic': {
    id: 'organic',
    name: 'Bio',
    description: 'Ingredients issus de l\'agriculture biologique',
    icon: <Award className="w-full h-full" />,
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  'dermatologically_tested': {
    id: 'dermatologically_tested',
    name: 'Teste dermatologiquement',
    description: 'Teste sous controle dermatologique',
    icon: <CheckCircle className="w-full h-full" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  'hypoallergenic': {
    id: 'hypoallergenic',
    name: 'Hypoallergenique',
    description: 'Formule minimisant les risques d\'allergie',
    icon: <ShieldCheck className="w-full h-full" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100'
  },
  'made_in_france': {
    id: 'made_in_france',
    name: 'Made in France',
    description: 'Fabrique en France',
    icon: <Globe className="w-full h-full" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  }
};

export const CertificationBadges: React.FC<CertificationBadgesProps> = ({
  certifications,
  size = 'medium',
  showLabels = true
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const iconSizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  if (!certifications || certifications.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        Aucune certification trouvee
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {certifications.map((certId, index) => {
        const cert = certificationData[certId];
        
        if (!cert) {
          // Certification non reconnue
          return (
            <div key={certId} className="flex items-center gap-2">
              <div className={`${sizeClasses[size]} ${iconSizeClasses[size]} rounded-full bg-gray-100 flex items-center justify-center`}>
                <Award className="w-full h-full text-gray-500" />
              </div>
              {showLabels && (
                <span className="text-sm text-gray-600">{certId}</span>
              )}
            </div>
          );
        }

        return (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
          >
            <div className={showLabels ? 'flex items-center gap-3' : ''}>
              {/* Badge */}
              <div className={`
                ${sizeClasses[size]} 
                ${cert.bgColor} 
                rounded-full 
                flex items-center justify-center 
                transition-transform group-hover:scale-110
                cursor-help
              `}>
                <div className={`${iconSizeClasses[size]} ${cert.color}`}>
                  {cert.icon}
                </div>
              </div>
              
              {/* Label */}
              {showLabels && (
                <div>
                  <p className="font-medium text-gray-900">{cert.name}</p>
                  <p className="text-xs text-gray-500">{cert.description}</p>
                </div>
              )}
            </div>
            
            {/* Tooltip (si pas de labels) */}
            {!showLabels && (
              <div className="
                absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity duration-200
                z-10
              ">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                  <p className="font-medium">{cert.name}</p>
                  <p className="text-gray-300">{cert.description}</p>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

// Composant pour afficher un resume des certifications
export const CertificationSummary: React.FC<{ certifications: string[] }> = ({ certifications }) => {
  const categories = {
    organic: ['cosmos_organic', 'cosmos_natural', 'ecocert', 'natrue', 'bdih', 'organic'],
    ethical: ['leaping_bunny', 'cruelty_free', 'vegan'],
    safety: ['dermatologically_tested', 'hypoallergenic'],
    origin: ['made_in_france']
  };

  const categorizedCerts = {
    organic: certifications.filter(c => categories.organic.includes(c)),
    ethical: certifications.filter(c => categories.ethical.includes(c)),
    safety: certifications.filter(c => categories.safety.includes(c)),
    origin: certifications.filter(c => categories.origin.includes(c))
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categorizedCerts.organic.length > 0 && (
        <div className="text-center">
          <Leaf className="w-8 h-8 mx-auto text-green-700 mb-2" />
          <p className="text-sm font-medium">Certifie Bio</p>
          <p className="text-xs text-gray-500">{categorizedCerts.organic.length} certification(s)</p>
        </div>
      )}
      
      {categorizedCerts.ethical.length > 0 && (
        <div className="text-center">
          <Heart className="w-8 h-8 mx-auto text-pink-600 mb-2" />
          <p className="text-sm font-medium">aathique</p>
          <p className="text-xs text-gray-500">{categorizedCerts.ethical.length} certification(s)</p>
        </div>
      )}
      
      {categorizedCerts.safety.length > 0 && (
        <div className="text-center">
          <ShieldCheck className="w-8 h-8 mx-auto text-blue-600 mb-2" />
          <p className="text-sm font-medium">Securite</p>
          <p className="text-xs text-gray-500">{categorizedCerts.safety.length} certification(s)</p>
        </div>
      )}
      
      {categorizedCerts.origin.length > 0 && (
        <div className="text-center">
          <Globe className="w-8 h-8 mx-auto text-purple-600 mb-2" />
          <p className="text-sm font-medium">Origine</p>
          <p className="text-xs text-gray-500">{categorizedCerts.origin.length} certification(s)</p>
        </div>
      )}
    </div>
  );
};

export default CertificationBadges;




