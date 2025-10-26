// PATH: frontend/src/App.tsx
import React, { lazy, Suspense, useState } from 'react';
import './utils/keepAlive';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './Contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import { DisclaimerModal, hasAcceptedDisclaimer } from './components/legal/DisclaimerModal';
import { CategoryProvider } from './Contexts/CategoryContext';
import OCRWizardPage from './pages/OCRWizardPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { MealPlanPage } from './pages/MealPlanPage';

// Lazy loading des pages
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const AssistantPage = lazy(() => import('./pages/AssistantPage'));
const ShoppingListPage = lazy(() => import('./pages/ShoppingListPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
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
    <CategoryProvider>
      <>
      {!window.location.pathname.startsWith('/auth/callback') && showDisclaimer && (
        <DisclaimerModal onAccept={() => setShowDisclaimer(false)} />
      )}
      
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="product/:id" element={<ProductPage />} />
            <Route path="scan" element={<BarcodeScanPage />} />
            <Route path="ocr" element={<Navigate to="/scan" replace />} />
            <Route path="ocr-wizard" element={<OCRWizardPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="multi-scan" element={<MultiScanPage />} />
            <Route path="premium" element={<PremiumPage />} />
            <Route path="meal-plan" element={<MealPlanPage />} />
            <Route path="diagnostic" element={<DiagnosticPage />} />

            <Route
              path="login"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route
              path="register"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
            />

            <Route path="assistant" element={<AssistantPage />} />
            <Route path="shopping-list" element={<ShoppingListPage />} />
            <Route path="results" element={<ResultsPage />} />

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
    </CategoryProvider>
  );
};

export default App;