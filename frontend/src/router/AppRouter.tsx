// PATH: frontend/src/router/AppRouter.tsx
// Router principal avec ErrorBoundary pour capturer toutes les erreurs

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';

// Import des pages
import MultiCategoriesPage from '../pages/MultiCategoriesPage';
import ProductPage from '../pages/ProductPage';
import SearchPage from '../pages/SearchPage';
import AdminDashboard from '../pages/AdminDashboard';
import TestAffiliate from '../pages/TestAffiliate';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Route par défaut - Multi-catégories */}
          <Route path="/" element={<MultiCategoriesPage />} />
          
          {/* Page multi-catégories */}
          <Route path="/categories" element={<MultiCategoriesPage />} />
          
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
