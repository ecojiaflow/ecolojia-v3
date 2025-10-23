// PATH: frontend/src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Import direct des pages principales qui existent
import HomePage from './pages/HomePage';
import Scan from './pages/Scan';
import ProductPage from './pages/ProductPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import Results from './pages/Results';

// aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Pages legales
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

// aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Composant de chargement
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4 animate-pulse">Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â±</div>
      <p className="text-gray-600">Chargement...</p>
    </div>
  </div>
);

// aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Layout simple avec navigation
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    {/* Navigation */}
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â±</span>
            <span className="font-bold text-xl text-gray-800">ECOLOJIA</span>
          </Link>
          <div className="flex space-x-4">
            <Link to="/scan" className="text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Scanner
            </Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Dashboard
            </Link>
            <Link to="/history" className="text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Historique
            </Link>
            <Link to="/chat" className="text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Chat IA
            </Link>
            <Link to="/profile" className="text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Profil
            </Link>
          </div>
        </div>
      </div>
    </nav>

    {/* Contenu principal */}
    <main className="flex-grow">
      {children}
    </main>

    {/* Footer */}
    <footer className="bg-gray-100 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="text-gray-600 text-sm">
            Æ’Ã†â€™aÃ¢â€šÂ¬Ã…Â¡â€šÃ‚Â© 2025 ECOLOJIA - L'assistant IA pour une consommation consciente
          </div>
          <div className="flex space-x-4 text-sm">
            <Link to="/about" className="text-gray-600 hover:text-green-600">Æ’Ã†â€™â€ Ã¢â‚¬â„¢aÃ¢â‚¬Å¡Ã‚Â¬ propos</Link>
            <Link to="/privacy" className="text-gray-600 hover:text-green-600">Confidentialite</Link>
            <Link to="/terms" className="text-gray-600 hover:text-green-600">Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  </div>
);

// aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Page Premium simple
const PremiumPage = () => (
  <div className="min-h-screen bg-gray-50 py-12">
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">aÆ’Ã¢â‚¬Å¡â€šÃ‚Â­Æ’Ã¢â‚¬Å¡â€šÃ‚Â ECOLOJIA Premium</h1>
        <p className="text-xl text-gray-600 mb-8">
          Debloquez toutes les fonctionnalites avancees
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“ Gratuit</h3>
            <div className="text-3xl font-bold mb-4">0aaaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã‚Â¡Æ’Ã¢â‚¬Å¡â€šÃ‚Â¬</div>
            <ul className="text-left space-y-2 text-sm">
              <li>aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ 30 scans/mois</li>
              <li>aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Analyse complete IA</li>
              <li>aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ 3 categories de produits</li>
              <li>aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Chat IA illimite</li>
              <li>aÆ’Ã¢â‚¬Å¡â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Export de donnees</li>
            </ul>
          </div>
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
            <h3 className="text-lg font-semibold mb-4 text-purple-800">aÆ’Ã¢â‚¬Å¡â€šÃ‚Â­Æ’Ã¢â‚¬Å¡â€šÃ‚Â Premium</h3>
            <div className="text-3xl font-bold mb-1">2,49aaaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã‚Â¡Æ’Ã¢â‚¬Å¡â€šÃ‚Â¬</div>
            <div className="text-sm text-gray-600 mb-4">par mois</div>
            <ul className="text-left space-y-2 text-sm">
              <li>aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Scans illimites</li>
              <li>aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Chat IA illimite</li>
              <li>aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Dashboard avance</li>
              <li>aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Export PDF/Excel</li>
              <li>aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Support prioritaire</li>
            </ul>
            <button className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg">
              Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦â€šÃ‚Â¡aÃ¢â‚¬Å¡Ã‚Â¬ Essai gratuit 7 jours
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Pages placeholders pour celles qui n'existent pas encore
const MultiProductScanPage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <h1 className="text-3xl font-bold text-center">Multi-Scan (Bientot disponible)</h1>
  </div>
);

const ManualAnalysisPage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <h1 className="text-3xl font-bold text-center">Analyse Manuelle (Bientot disponible)</h1>
  </div>
);

const CosmeticAnalysisPage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <h1 className="text-3xl font-bold text-center">Analyse Cosmetiques (Bientot disponible)</h1>
  </div>
);

const DetergentAnalysisPage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <h1 className="text-3xl font-bold text-center">Analyse Detergents (Bientot disponible)</h1>
  </div>
);

const UnifiedResultsPage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <h1 className="text-3xl font-bold text-center">Resultats Unifies (Bientot disponible)</h1>
  </div>
);

const StatsPage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <h1 className="text-3xl font-bold text-center">Statistiques (Bientot disponible)</h1>
  </div>
);

// aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ Page 404 amelioree
const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="text-8xl mb-4">Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Å¡â€šÃ‚Â¤aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â</div>
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Page introuvable</h1>
      <p className="text-gray-600 mb-6">La page que vous recherchez n'existe pas.</p>
      <Link to="/" className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center">
        Retour Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  l'accueil
      </Link>
    </div>
  </div>
);

// aÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã…â€œaaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â¦ APPLICATION PRINCIPALE
const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ===== PAGES PRINCIPALES ===== */}
            <Route path="/" element={<HomePage />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/search" element={<HomePage />} /> {/* HomePage ? dejÆ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  une recherche */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* ===== PRODUITS ET ANALYSES ===== */}
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/product" element={<ProductPage />} />
            <Route path="/results" element={<Results />} />
            <Route path="/unified-results" element={<UnifiedResultsPage />} />
            <Route path="/analyze/manual" element={<ManualAnalysisPage />} />
            <Route path="/analyze" element={<ProductPage />} />
            
            {/* ===== MULTI-PRODUITS ===== */}
            <Route path="/multi-scan" element={<MultiProductScanPage />} />
            <Route path="/stats" element={<StatsPage />} />
            
            {/* ===== CATÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°GORIES SPÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°CIFIQUES ===== */}
            <Route path="/products/:productId/cosmetic" element={<CosmeticAnalysisPage />} />
            <Route path="/products/:productId/detergent" element={<DetergentAnalysisPage />} />
            <Route path="/cosmetics" element={<CosmeticAnalysisPage />} />
            <Route path="/detergents" element={<DetergentAnalysisPage />} />
            
            {/* ===== PAGES LÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°GALES ===== */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            
            {/* ===== PREMIUM ===== */}
            <Route path="/premium" element={<PremiumPage />} />
            
            {/* ===== 404 ===== */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
};

export default App;

