// PATH: frontend/src/App.tsx
import React, { lazy, Suspense, useState } from 'react';
import './utils/keepAlive';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './Contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import { DisclaimerModal, hasAcceptedDisclaimer } from './components/legal/DisclaimerModal';
import OCRWizardPage from './pages/OCRWizardPage';

// Lazy loading des pages
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPageIntegrated'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ScanPage = lazy(() => import('./pages/ScanPage'));
const BarcodeScanPage = lazy(() => import('./pages/ScanPageIntegrated'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PremiumPage = lazy(() => import('./pages/PremiumPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DiagnosticPage = lazy(() => import('./pages/DiagnosticPage'));
const MultiScanPage = lazy(() => import('./pages/MultiScanPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));

const App: React.FC = () => {
  const { isAuthenticated } = useAuthContext();
  const [showDisclaimer, setShowDisclaimer] = useState(!hasAcceptedDisclaimer());

  return (
    <>
      
      {showDisclaimer && <DisclaimerModal onAccept={() => setShowDisclaimer(false)} />}
      
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="product/:id" element={<ProductPage />} />
            <Route path="scan" element={<BarcodeScanPage />} />
            {/* ✅ SUPPRIMÉ : Ancienne page OCR simple - Redirection vers scan */}
            <Route path="ocr" element={<Navigate to="/scan" replace />} />
            <Route path="ocr-wizard" element={<OCRWizardPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="multi-scan" element={<MultiScanPage />} />
            <Route path="premium" element={<PremiumPage />} />
            <Route path="diagnostic" element={<DiagnosticPage />} />

            <Route
              path="login"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route
              path="register"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
            />

            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="onboarding" element={<OnboardingPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

export default App;