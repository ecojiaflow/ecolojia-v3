// PATH: frontend/src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/context/AuthContext';
import TestLogin from './pages/TestLogin';

// Pages d'authentification
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';

// Import des pages existantes
import HomePage from './pages/HomePage';
import Navbar from './components/Navbar';
import SearchPage from './pages/SearchPage';
import ScanPage from './pages/ScanPage';
import ProductPage from './pages/ProductPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ResultsPage from './pages/ResultsPage';

// Import des composants d'authentification
import { AuthPage } from './auth/components/AuthPage';

// Pages légales
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import MultiScanPage from './pages/MultiScanPage';
import FavoritesPage from './pages/FavoritesPage';

// Composant de chargement
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4 animate-pulse">ðŸŒ±</div>
      <p className="text-gray-600">Chargement...</p>
    </div>
  </div>
);

// Composant pour les routes protégées
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Layout avec navigation
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation avec Navbar avancé */}
      <Navbar />

      {/* Contenu principal */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-between items-center">
            <div className="text-gray-600 text-sm">
              © 2025 ECOLOJIA - L'assistant IA pour une consommation consciente
            </div>
            <div className="flex space-x-4 text-sm">
              <Link to="/about" className="text-gray-600 hover:text-green-600">À propos</Link>
              <Link to="/privacy" className="text-gray-600 hover:text-green-600">Confidentialité</Link>
              <Link to="/terms" className="text-gray-600 hover:text-green-600">Conditions</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Page 404
const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="text-8xl mb-4">ðŸ¤”</div>
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Page introuvable</h1>
      <p className="text-gray-600 mb-6">La page que vous recherchez n'existe pas.</p>
      <Link to="/" className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center">
        Retour Ã  l'accueil
      </Link>
    </div>
  </div>
);

// Composant AppContent (avec Layout Ã  l'intérieur du Provider)
const AppContent = () => {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* PAGES PUBLIQUES */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/login" element={<AuthPage defaultMode="login" />} />
          <Route path="/auth/register" element={<AuthPage defaultMode="register" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/test-login" element={<TestLogin />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* PAGES PROTÉGÉES */}
          <Route path="/scan" element={
            <ProtectedRoute>
              <ScanPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/product/:id" element={
            <ProtectedRoute>
              <ProductPage />
            </ProtectedRoute>
          } />
          <Route path="/results" element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          } />

          {/* 404 */}          <Route path="/multi-scan" element={
            <ProtectedRoute>
              <MultiScanPage />
            </ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

// APPLICATION PRINCIPALE
const App: React.FC = () => {
  return (
    <BrowserRouter 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;






