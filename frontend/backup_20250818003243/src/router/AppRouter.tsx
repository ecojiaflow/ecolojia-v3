// PATH: frontend/src/router/AppRouter.tsx
// Router principal avec ErrorBoundary pour capturer toutes les erreurs

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';

// Import des pages
import MultiCATÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°GORIESPage from '../pages/MultiCATÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°GORIESPage';
import ProductPage from '../pages/ProductPage';
import SearchPage from '../pages/SearchPage';
import AdminDashboard from '../pages/AdminDashboard';
import TestAffiliate from '../pages/TestAffiliate';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Route par defaut - Multi-CATÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°GORIES */}
          <Route path="/" element={<MultiCATÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°GORIESPage />} />
          
          {/* Page multi-CATÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°GORIES */}
          <Route path="/CATÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°GORIES" element={<MultiCATÆ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°GORIESPage />} />
          
          {/* Page produit */}
          <Route path="/product" element={<ProductPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          
          {/* Page recherche Algolia */}
          <Route path="/search" element={<SearchPage />} />
          
          {/* Page admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Page de test affiliation */}
          <Route path="/test-affiliate" element={<TestAffiliate />} />
          
          {/* Redirection des routes non trouvees */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default AppRouter;


