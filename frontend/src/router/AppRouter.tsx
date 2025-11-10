// PATH: frontend/src/router/AppRouter.tsx
// Router principal avec ErrorBoundary

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';

// Import des pages
import HomePage from '../pages/HomePage';
import ProductPage from '../pages/ProductPage';
import SearchPage from '../pages/SearchPage';
import ScanPageIntegrated from '../pages/ScanPageIntegrated';
import DashboardPage from '../pages/DashboardPage';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Route par défaut - Home */}
          <Route path="/" element={<HomePage />} />

          {/* Page scan */}
          <Route path="/scan" element={<ScanPageIntegrated />} />

          {/* Page produit */}
          <Route path="/product" element={<ProductPage />} />
          <Route path="/product/:barcode" element={<ProductPage />} />

          {/* Page recherche Algolia */}
          <Route path="/search" element={<SearchPage />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Redirection des routes non trouvées */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default AppRouter;