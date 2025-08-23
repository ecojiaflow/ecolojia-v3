// PATH: frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ScanPage from "./pages/ScanPage";
import SearchPage from "./pages/SearchPage";
import ResultPage from "./pages/ResultPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import PricingPage from "./pages/PricingPage";

// Composant de navigation professionnel
function Navigation() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl">🌿</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ECOLOJIA</span>
          </Link>

          {/* Navigation principale */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-medium transition-colors ${
                isActive("/") 
                  ? "text-green-600" 
                  : "text-gray-700 hover:text-green-600"
              }`}
            >
              Accueil
            </Link>
            <Link
              to="/scan"
              className={`font-medium transition-colors ${
                isActive("/scan") 
                  ? "text-green-600" 
                  : "text-gray-700 hover:text-green-600"
              }`}
            >
              Scanner
            </Link>
            <Link
              to="/search"
              className={`font-medium transition-colors ${
                isActive("/search") 
                  ? "text-green-600" 
                  : "text-gray-700 hover:text-green-600"
              }`}
            >
              Rechercher
            </Link>
            <Link
              to="/history"
              className={`font-medium transition-colors ${
                isActive("/history") 
                  ? "text-green-600" 
                  : "text-gray-700 hover:text-green-600"
              }`}
            >
              Historique
            </Link>
          </nav>

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="text-gray-700 hover:text-green-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Se connecter
            </Link>
          </div>

          {/* Menu mobile */}
          <button className="md:hidden text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="flex-1">
          <Routes>
            {/* Page d'accueil professionnelle */}
            <Route path="/" element={<HomePage />} />
            
            {/* Pages principales */}
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/history" element={<HistoryPage />} />
            
            {/* Pages utilisateur */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            
            {/* Redirection 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

