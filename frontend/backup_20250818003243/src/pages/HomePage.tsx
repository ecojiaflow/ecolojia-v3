// PATH: frontend/src/pages/HomePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, TrendingUp, Shield, Sparkles, ArrowRight, 
  Award, Users, BarChart3, Leaf, Heart, Star,
  ShoppingBag, Camera, Package, Clock, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const stats = [
    { icon: Package, value: '2M+', label: 'Produits analyses', color: 'text-green-600' },
    { icon: Shield, value: '100%', label: 'Scientifique', color: 'text-blue-600' },
    { icon: Clock, value: '<2s', label: "Temps d'analyse", color: 'text-purple-600' },
    { icon: Users, value: '500k+', label: 'Utilisateurs actifs', color: 'text-orange-600' }
  ];

  const categories = [
    { 
      name: 'Alimentaire', 
      icon: '°Å¸Â¥â€”', 
      count: '1.2M produits',
      color: 'from-green-400 to-green-600',
      popular: ['Nutella', 'Yaourt', 'Pain bio']
    },
    { 
      name: 'Cosmetique', 
      icon: '°Å¸â€™â€ž', 
      count: '450k produits',
      color: 'from-pink-400 to-pink-600',
      popular: ['Shampoing', 'Creme', 'Deodorant']
    },
    { 
      name: 'Entretien', 
      icon: '°Å¸Â§Â¹', 
      count: '250k produits',
      color: 'from-blue-400 to-blue-600',
      popular: ['Lessive', 'Liquide vaisselle', 'Nettoyant']
    },
    { 
      name: 'Hygiene', 
      icon: '°Å¸Â§Â¼', 
      count: '180k produits',
      color: 'from-purple-400 to-purple-600',
      popular: ['Dentifrice', 'Savon', 'Gel douche']
    }
  ];

  const features = [
    {
      icon: Camera,
      title: 'Scanner Intelligent',
      description: 'Analysez instantanement avec photo, code-barres ou recherche manuelle',
      color: 'bg-green-100 text-green-700'
    },
    {
      icon: BarChart3,
      title: 'Analyses Scientifiques',
      description: 'NOVA, Nutri-Score, additifs et impact environnemental detaille',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      icon: Sparkles,
      title: 'IA Personnalisee',
      description: 'Recommandations adaptees ƒÂ  votre profil et vos objectifs sante',
      color: 'bg-purple-100 text-purple-700'
    }
  ];

  const testimonials = [
    {
      name: 'Marie L.',
      role: 'Maman de 3 enfants',
      content: "ECOLOJIA m'aide ƒÂ  choisir les meilleurs produits pour ma famille. Les analyses sont claires et fiables.",
      rating: 5
    },
    {
      name: 'Thomas B.',
      role: 'Sportif amateur',
      content: "Je scanne tous mes produits avant achat. L'app m'a fait decouvrir des alternatives plus saines.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50 opacity-70" />
        
        <div className="relative container mx-auto px-4 pt-20 pb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">IA Scientifique Multi-Categories</span>
              <span className="text-xs bg-green-800 text-white px-2 py-0.5 rounded-full">Nouveau</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              L'assistant IA pour une{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                consommation consciente
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Analysez instantanement vos produits alimentaires, cosmetiques et detergents
              grace ƒÂ  notre IA basee sur INSERM, ANSES et EFSA
            </p>

            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto mb-8">
              <div className={`relative flex items-center bg-white rounded-2xl shadow-xl transition-all duration-300 ${isSearchFocused ? 'ring-4 ring-green-100' : ''}`}>
                <Search className="absolute left-6 w-5 h-5 text-gray-400" />
                
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Recherchez parmi 2M+ produits (Nutella, L'Oreal, Ariel...)"
                  className="w-full pl-14 pr-4 py-5 text-lg rounded-l-2xl focus:outline-none"
                />

                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-5 
                           rounded-r-2xl font-medium hover:from-green-600 hover:to-green-700 
                           transition-all flex items-center gap-2 group"
                >
                  Rechercher
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {['°Å¸ÂÂ« Nutella bio', '°Å¸Â§Â´ Shampoing sans sulfate', '°Å¸Â§Â½ Lessive ecologique', '°Å¸Â¦Â· Dentifrice naturel'].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setSearchQuery(suggestion.slice(2))}
                    className="px-4 py-2 bg-white rounded-full text-sm hover:bg-green-50 
                             transition-colors border border-gray-200 hover:border-green-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </form>

            {/* CTA */}
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/scan')}
                className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-xl 
                         shadow-md hover:shadow-lg transition-all group"
              >
                <Camera className="w-5 h-5 text-green-600" />
                <span className="font-medium">Scanner un produit</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 
                         rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Essai gratuit Premium</span>
              </button>
            </div>
          </motion.div>

          {/* Badges flottants */}
          <div className="absolute top-20 left-10 bg-white p-3 rounded-lg shadow-lg animate-bounce">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">Top App Sante 2025</span>
            </div>
          </div>

          <div className="absolute bottom-20 right-10 bg-white p-3 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium">500k+ utilisateurs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
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
                <div className={`inline-flex p-3 rounded-lg bg-gray-50 ${stat.color} mb-3`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Explorez par categorie</h2>
            <p className="text-lg text-gray-600">Analyse complete pour tous vos produits du quotidien</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/search?category=${category.name}`)}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-3xl">{category.icon}</span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{category.count}</p>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Populaires :</p>
                    <div className="flex flex-wrap gap-1">
                      {category.popular.map((item) => (
                        <span key={item} className="text-xs bg-gray-100 px-2 py-1 rounded">{item}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center text-green-600 font-medium">
                    Explorer
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pourquoi choisir ECOLOJIA ?</h2>
            <p className="text-lg text-gray-600">La technologie au service de votre sante</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all"
              >
                <div className={`inline-flex p-4 rounded-xl ${feature.color} mb-6`}>
                  <feature.icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>

                <button className="text-green-600 font-medium inline-flex items-center hover:text-green-700 transition-colors">
                  En savoir plus
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Temoignages */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ils nous font confiance</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>

                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Pret ƒÂ  transformer votre consommation ?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Rejoignez 500 000+ utilisateurs qui font des choix eclaires chaque jour
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate('/auth')}
              className="bg-white text-green-600 px-8 py-4 rounded-xl font-medium 
                       hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Commencer gratuitement
            </button>

            <button
              onClick={() => navigate('/pricing')}
              className="bg-green-700 text-white px-8 py-4 rounded-xl font-medium 
                       hover:bg-green-800 transition-colors inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Decouvrir Premium
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

