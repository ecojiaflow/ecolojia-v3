import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Camera,
  Package,
  Shield,
  Clock,
  Users,
  Sparkles,
  Star,
  Scan
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCategory } from '../Contexts/CategoryContext';
import { AISearchWidget } from '../components/ai';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setCategory } = useCategory();

  const stats = [
    { icon: Package, value: '2M+', label: 'Produits analyses', color: 'text-primary' },
    { icon: Shield, value: '100%', label: 'Scientifique', color: 'text-blue-600' },
    { icon: Clock, value: '<2s', label: "Temps d'analyse", color: 'text-forest-dark' },
    { icon: Users, value: '500k+', label: 'Utilisateurs actifs', color: 'text-orange-600' }
  ];

  const categories = [
    {
      name: 'Alimentaire',
      id: 'food' as const,
      icon: '🥫',
      count: '1.2M produits',
      color: 'from-green-400 to-green-600',
      popular: ['Cereales bio', 'Yaourt nature', 'Fruits secs']
    },
    {
      name: 'Cosmetiques',
      id: 'cosmetics' as const,
      icon: '💄',
      count: '450k produits',
      color: 'from-pink-400 to-pink-600',
      popular: ['Savon naturel', 'Creme bio', 'Dentifrice eco']
    },
    {
      name: 'Detergents',
      id: 'detergents' as const,
      icon: '🧼',
      count: '250k produits',
      color: 'from-blue-400 to-blue-600',
      popular: ['Lessive eco', 'Produit vaisselle', 'Nettoyant eco']
    }
  ];

  const features = [
    {
      icon: Camera,
      title: 'Scanner Intelligent',
      description: 'Analysez instantanement avec photo, code-barres ou recherche manuelle',
      color: 'bg-primary-100 text-primary'
    },
    {
      icon: BarChart3,
      title: 'Analyses Scientifiques',
      description: 'NOVA, Nutri-Score, additifs et impact environnemental detaille',
      color: 'bg-primary-100 text-blue-700'
    },
    {
      icon: Sparkles,
      title: 'IA Personnalisee',
      description: 'Recommandations adaptees a votre profil et vos objectifs Sante',
      color: 'bg-primary-100 text-forest-dark'
    }
  ];

  return (
    <div className="min-h-screen bg-white md:bg-gradient-to-b md:from-white md:to-gray-50">
      {/* Hero Section */}
      <section className="px-4 pt-6 pb-8 md:pt-20 md:pb-32 md:px-0">
        <div className="md:container md:mx-auto md:px-4">
          <div className="text-center space-y-4 md:space-y-6 md:max-w-4xl md:mx-auto">
            {/* Badge IA */}
            <div className="inline-flex items-center gap-2 bg-primary-100 text-green-800 px-3 py-1 md:px-4 md:py-2 rounded-full">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs md:text-sm font-medium">
                <span className="md:hidden">Recherche IA intelligente</span>
                <span className="hidden md:inline">IA Scientifique Multi-Categories</span>
              </span>
            </div>

            {/* Titre */}
            <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              <span className="md:hidden">Trouvez vos produits</span>
              <span className="hidden md:inline">
                Consommation{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                  consciente
                </span>
              </span>
            </h1>

            {/* Description desktop */}
            <p className="hidden md:block text-xl text-gray-600 max-w-3xl mx-auto">
              Analysez vos produits alimentaires, cosmetiques et detergents avec notre IA scientifique.
              Scores detailles, recommendations personnalisees et alternatives eco-responsables.
            </p>

            {/* Barre recherche IA */}
            <div className="w-full">
              <AISearchWidget
                placeholder="Recherche IA : 'chocolat vegan bio', 'shampoing naturel'..."
                className="w-full md:max-w-3xl md:mx-auto"
                showMetadata={false}
                autoFocus={false}
              />
            </div>

            {/* 🆕 2 BOUTONS SCANNER (mobile uniquement) */}
            <div className="md:hidden space-y-3">
              {/* Bouton 1 : Scanner code-barres (prioritaire) */}
              <button
                onClick={() => navigate('/scan/barcode')}
                className="w-full bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 rounded-2xl p-6 shadow-xl active:scale-95 transition-transform"
              >
                <div className="flex items-center justify-center text-white space-x-3">
                  <Scan className="w-10 h-10 stroke-[2]" />
                  <div className="text-left">
                    <div className="text-lg font-bold">Scanner code-barres</div>
                    <div className="text-sm opacity-90">Analyse instantanée</div>
                  </div>
                </div>
              </button>

              {/* Bouton 2 : Analyser par photo (secondaire) */}
              <button
                onClick={() => navigate('/scan/photo')}
                className="w-full bg-white border-2 border-green-500 rounded-2xl p-6 shadow-md active:scale-95 transition-transform"
              >
                <div className="flex items-center justify-center text-green-700 space-x-3">
                  <Camera className="w-10 h-10 stroke-[2]" />
                  <div className="text-left">
                    <div className="text-lg font-bold">Analyser par photo</div>
                    <div className="text-sm opacity-75">Produit sans code-barres</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Desktop : Info scanner mobile */}
            <div className="hidden md:flex flex-wrap gap-4 justify-center">
              <div className="inline-flex items-center gap-2 bg-blue-50 border-2 border-blue-200 px-6 py-3 rounded-xl">
                <Camera className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Scanner disponible sur mobile</span>
              </div>

              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Essai gratuit Premium</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-6 md:py-16 bg-white md:bg-primary-50">
        <div className="md:container md:mx-auto md:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-primary-50 md:bg-transparent p-4 rounded-xl md:rounded-none shadow-md md:shadow-none text-center"
              >
                <div className={`inline-flex p-3 rounded-lg bg-white md:bg-primary-50 ${stat.color} mb-2 md:mb-3`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs md:text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories (desktop uniquement) */}
      <section className="hidden md:block py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Explorez par categorie</h2>
            <p className="text-lg text-gray-600">Analyse complete pour tous vos produits du quotidien</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  setCategory(category.id);
                  navigate('/search');
                }}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-3xl">{category.icon}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{category.count}</p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Populaires :</p>
                    <div className="flex flex-wrap gap-1">
                      {category.popular.map((item) => (
                        <span key={item} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-primary font-medium">
                    Explorer
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features (desktop uniquement) */}
      <section className="hidden md:block py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pourquoi choisir ECOLOJIA ?</h2>
            <p className="text-lg text-gray-600">Une plateforme complete pour une consommation responsable</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final (desktop uniquement) */}
      <section className="hidden md:block py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pret a faire des choix plus eclaires ?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Rejoignez la communaute ECOLOJIA et commencez a analyser vos produits des maintenant
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold">
              <Camera className="w-5 h-5" />
              <span>Scanner sur mobile</span>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 bg-white text-green-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              <span>Creer un compte gratuit</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
