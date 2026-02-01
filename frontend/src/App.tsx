/**
 * App.tsx — ECOLOJIA V1 PRO
 * Routes simplifiées pour V1
 */

import React, { lazy, Suspense, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthContext } from "./Contexts/AuthContext";
import Layout from "./components/layout/Layout";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ProtectedRoute from "./components/ProtectedRoute";
import { DisclaimerModal, hasAcceptedDisclaimer } from "./components/legal/DisclaimerModal";
import { CategoryProvider } from "./Contexts/CategoryContext";
import AuthCallbackPage from "./pages/AuthCallbackPage";

// ============================================================================
// PAGES V1 (Lazy loaded)
// ============================================================================

// Core V1
const HomePage = lazy(() => import("./pages/HomePage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const ScanPage = lazy(() => import("./pages/ScanPageIntegrated"));
const SearchPage = lazy(() => import("./pages/SearchPage"));

// Auth
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));

// User (Protected)
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

// Premium
const PremiumPage = lazy(() => import("./pages/PremiumPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));

// Legal
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));

// Learn
import FichePage from "./pages/learn/FichePage";
const ReperesEcolojiaPage = lazy(() => import("./pages/ReperesEcolojiaPage"));

// ============================================================================
// APP
// ============================================================================

const App: React.FC = () => {
  const { isAuthenticated } = useAuthContext();
  const [showDisclaimer, setShowDisclaimer] = useState(!hasAcceptedDisclaimer());

  return (
    <CategoryProvider>
      <>
        {!window.location.pathname.startsWith("/auth/callback") && showDisclaimer && (
          <DisclaimerModal onAccept={() => setShowDisclaimer(false)} />
        )}

        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* OAuth Callback */}
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Main Layout */}
            <Route path="/" element={<Layout />}>
              {/* Public */}
              <Route index element={<HomePage />} />
              <Route path="scan" element={<ScanPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="product/:id" element={<ProductPage />} />
              <Route path="premium" element={<PremiumPage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="learn/reperes" element={<ReperesEcolojiaPage />} />
          <Route path="learn/fiche/:slug" element={<FichePage />} />

              {/* Auth */}
              <Route
                path="login"
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
              />
              <Route
                path="register"
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
              />

              {/* Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="favorites" element={<FavoritesPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </>
    </CategoryProvider>
  );
};

export default App;

