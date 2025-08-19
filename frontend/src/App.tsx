// PATH: frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScanPage from "./pages/ScanPage";
import ResultPage from "./pages/ResultPage";
import HistoryPage from "./pages/HistoryPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-6">
              <a href="/" className="text-xl font-bold text-emerald-600">ECOLOJIA</a>
              <div className="flex gap-4 ml-auto">
                <a href="/scan" className="text-gray-700 hover:text-emerald-600 transition-colors">Scanner</a>
                <a href="/result" className="text-gray-700 hover:text-emerald-600 transition-colors">Résultat</a>
                <a href="/history" className="text-gray-700 hover:text-emerald-600 transition-colors">Historique</a>
              </div>
            </nav>
          </div>
        </header>
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/scan" replace />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/scan" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}