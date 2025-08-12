// PATH: frontend/src/router/AppRouter.tsx
// Router principal avec ErrorBoundary pour capturer toutes les erreurs

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';

// Import des pages
import MultiCATÃƒâ€°GORIESPage from '../pages/MultiCATÃƒâ€°GORIESPage';
import ProductPage from '../pages/ProductPage';
import SearchPage from '../pages/SearchPage';
import AdminDashboard from '../pages/AdminDashboard';
import TestAffiliate from '../pages/TestAffiliate';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Route par défaut - Multi-CATÃƒâ€°GORIES */}
          <Route path="/" element={<MultiCATÃƒâ€°GORIESPage />} />
          
          {/* Page multi-CATÃƒâ€°GORIES */}
          <Route path="/CATÃƒâ€°GORIES" element={<MultiCATÃƒâ€°GORIESPage />} />
          
          {/* Page produit */}
          <Route path="/product" element={<ProductPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          
          {/* Page recherche Algolia */}
          <Route path="/search" element={<SearchPage />} />
          
          {/* Page admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Page de test affiliation */}
          <Route path="/test-affiliate" element={<TestAffiliate />} />
          
          {/* Redirection des routes non trouvées */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default AppRouter;

