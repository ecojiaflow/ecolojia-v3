// PATH: frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={
            <div className="p-8 text-center">
              <h1 className="text-3xl font-bold">ECOLOJIA</h1>
              <p className="mt-4">Application en cours de chargement...</p>
              <div className="mt-8 space-x-4">
                <a href="/scan" className="bg-green-500 text-white px-4 py-2 rounded">Scanner</a>
                <a href="/search" className="bg-blue-500 text-white px-4 py-2 rounded">Recherche</a>
              </div>
            </div>
          } />
          <Route path="/scan" element={
            <div className="p-8">
              <h1 className="text-2xl font-bold mb-4">Scanner</h1>
              <p>Page de scan</p>
            </div>
          } />
          <Route path="*" element={
            <div className="p-8 text-center">
              <h1 className="text-2xl">Page non trouvée</h1>
              <a href="/" className="text-blue-500 underline">Retour à l'accueil</a>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
