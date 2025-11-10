import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart3,
  Camera,
  CheckCircle,
  ChevronRight,
  Clock,
  Euro,
  Heart,
  Leaf,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  UtensilsCrossed
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDeviceContext } from '../hooks/useDeviceContext';
import { useCategory } from '../Contexts/CategoryContext';
import SearchBar from '../components/search/SearchBar';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useDeviceContext();
  const { setCategory } = useCategory();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

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

  const testimonials = [
    {
      name: 'Marie L.',
      role: 'Maman de 3 enfants',
      content: "ECOLOJIA m'a aidee a faire des choix plus sains pour ma famille. L'analyse detaillee des additifs est vraiment utile.",
      rating: 5
    },
    {
      name: 'Thomas B.',
      role: 'Sportif amateur',
      content: "Application indispensable pour suivre mon alimentation. Les scores sont clairs et precis.",
      rating: 5
    },
    {
      name: 'Sophie M.',
      role: 'Professionnelle de sante',
      content: "Enfin une app basee sur des donnees scientifiques solides. Je la recommande a mes patients.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {isMobile ? (
        <section className="px-4 pt-6 pb-20">
          <div className="space-y-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-primary-100 text-green-800 px-3 py-1 rounded-full mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-medium">Scanner instantane</span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Scannez vos produits
              </h1>
            </div>

            <Link
              to="/scan"
              className="block w-full bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all"
            >
              <div className="flex flex-col items-center justify-center text-white space-y-3">
                <Camera className="w-16 h-16 stroke-[2]" />
                <div className="text-xl font-bold">Scanner</div>
                <div className="text-sm opacity-90">Analysez instantanement</div>
              </div>
            </Link>

            <details className="bg-primary-50 p-4 rounded-xl shadow-md">
              <summary className="cursor-pointer font-medium text-gray-700 flex items-center justify-between">
                <span>Ou rechercher par nom</span>
                <Sparkles className="w-5 h-5 text-neutral-600" />
              </summary>
              <div className="mt-4">
                <SearchBar 
                  onSearch={handleSearch}
                  placeholder="Rechercher un produit..."
                  showSuggestions={true}
                  autoFocus={false}
                />
              </div>
            </details>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-primary-50 p-4 rounded-xl shadow-md text-center">
                <Package className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">2M+</div>
                <div className="text-xs text-gray-900">Produits</div>
              </div>
              <div className="bg-primary-50 p-4 rounded-xl shadow-md text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">500k+</div>
                <div className="text-xs text-gray-900">Utilisateurs</div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50 opacity-70" />
            <div className="relative container mx-auto px-4 pt-20 pb-32">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-center max-w-4xl mx-auto"
              >
                <div className="inline-flex items-center gap-2 bg-primary-100 text-green-800 px-4 py-2 rounded-full mb-6">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">IA Scientifique Multi-Categories</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                  Consommation{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                    consciente
                  </span>
                </h1>
                
                <p className="text-xl text-gray-900 mb-12 max-w-3xl mx-auto">
                  Analysez vos produits alimentaires, cosmetiques et detergents avec notre IA scientifique. 
                  Scores detailles, recommendations personnalisees et alternatives eco-responsables.
                </p>

                <div className="mb-8">
                  <SearchBar 
                    onSearch={handleSearch}
                    placeholder="Rechercher parmi 2M+ produits..."
                    showSuggestions={true}
                    autoFocus={false}
                    className="max-w-3xl mx-auto"
                  />
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  <button 
                    onClick={() => navigate('/scan?mode=camera')} 
                    className="inline-flex items-center gap-2 bg-primary-50 px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all group"
                  >
                    <Camera className="w-5 h-5 text-primary" />
                    <span className="font-medium">Scanner un produit</span>
                    <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <button 
                    onClick={() => navigate('/auth')} 
                    className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="font-medium">Essai gratuit Premium</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="py-16 bg-primary-50">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: index * 0.1 }} 
                    className="text-center"
                  >
                    <div className={`inline-flex p-3 rounded-lg bg-primary-50 ${stat.color} mb-3`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-900">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Explorez par categorie</h2>
                <p className="text-lg text-gray-900">Analyse complete pour tous vos produits du quotidien</p>
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
                    <div className="bg-primary-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <span className="text-3xl">{category.icon}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                      <p className="text-sm text-neutral-700 mb-4">{category.count}</p>
                      <div className="space-y-1">
                        <p className="text-xs text-neutral-600">Populaires :</p>
                        <div className="flex flex-wrap gap-1">
                          {category.popular.map((item) => (
                            <span key={item} className="text-xs bg-primary-100 px-2 py-1 rounded">
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

          <section className="py-20 bg-gradient-to-b from-white to-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Pourquoi choisir ECOLOJIA ?</h2>
                <p className="text-lg text-gray-900">Une plateforme complete pour une consommation responsable</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <motion.div 
                    key={feature.title} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: index * 0.1 }} 
                    className="bg-primary-50 rounded-2xl p-6 shadow-lg"
                  >
                    <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-900">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 bg-primary-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Ils nous font confiance</h2>
                <p className="text-lg text-gray-900">Rejoignez les 500k+ utilisateurs satisfaits</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <motion.div 
                    key={testimonial.name} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: index * 0.1 }} 
                    className="bg-primary-50 rounded-2xl p-6"
                  >
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-900 mb-4">"{testimonial.content}"</p>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-neutral-700">{testimonial.role}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Pret a faire des choix plus eclaires ?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Rejoignez la communaute ECOLOJIA et commencez a analyser vos produits des maintenant
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button 
                  onClick={() => navigate('/scan')} 
                  className="inline-flex items-center gap-2 bg-primary-50 text-green-700 px-8 py-4 rounded-xl font-semibold hover:bg-primary-100 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span>Scanner maintenant</span>
                </button>
                <button 
                  onClick={() => navigate('/register')} 
                  className="inline-flex items-center gap-2 bg-transparent border-2 border-white text-forest px-8 py-4 rounded-xl font-semibold hover:bg-primary-50/10 transition-colors"
                >
                  <span>Creer un compte gratuit</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default HomePage;