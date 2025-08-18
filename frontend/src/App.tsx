// PATH: frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import ScanPage from "./pages/ScanPage";
import ResultPage from "./pages/ResultPage";

export default function App() {
  return (
    <BrowserRouter>
      <header className="border-b">
        <div className="max-w-5xl mx-auto p-4 flex items-center gap-4">
          <Link to="/" className="font-bold">ECOLOJIA</Link>
          <nav className="text-sm">
            <Link to="/scan" className="px-2">Scanner</Link>
            <Link to="/result" className="px-2">Résultat</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/scan" replace />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="*" element={<div>404</div>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
