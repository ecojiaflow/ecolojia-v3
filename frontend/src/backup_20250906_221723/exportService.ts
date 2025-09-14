// PATH: frontend/src/services/exportService.ts
import { get } from "./apiClient";
import { getToken } from "./authService";
import type { AnalysisResult, FavoriteItem } from "../types/api";

export type ExportFormat = "json" | "csv" | "pdf";

export type ExportData = {
  history: AnalysisResult[];
  favorites: FavoriteItem[];
  stats: any;
  exportDate: string;
  format: ExportFormat;
};

/**
 * Tente d'abord l'export côté serveur (GDPR), sinon export local
 */
export async function exportUserData(format: ExportFormat = "json"): Promise<Blob> {
  try {
    // Tentative via l'API (avec auth si disponible)
    const token = getToken();
    const response = await get("/gdpr/download-data", {
      params: { format },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      responseType: "blob"
    });
    return response as Blob;
  } catch {
    // Fallback: export local
    return exportLocalData(format);
  }
}

/**
 * Export local des données stockées dans le navigateur
 */
async function exportLocalData(format: ExportFormat): Promise<Blob> {
  // Récupération des données locales
  const history = loadLocalHistory();
  const favorites = loadLocalFavorites();
  const stats = calculateLocalStats(history);

  const exportData: ExportData = {
    history,
    favorites,
    stats,
    exportDate: new Date().toISOString(),
    format
  };

  switch (format) {
    case "json":
      return new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    
    case "csv":
      return exportToCSV(exportData);
    
    case "pdf":
      // Pour le PDF, on génère un HTML simple qu'on peut imprimer
      return exportToHTML(exportData);
    
    default:
      throw new Error(`Format non supporté: ${format}`);
  }
}

function loadLocalHistory(): AnalysisResult[] {
  try {
    return JSON.parse(localStorage.getItem("ecolojia-history") || "[]");
  } catch {
    return [];
  }
}

function loadLocalFavorites(): FavoriteItem[] {
  try {
    return JSON.parse(localStorage.getItem("ecolojia-favorites") || "[]");
  } catch {
    return [];
  }
}

function calculateLocalStats(history: AnalysisResult[]) {
  const totalScans = history.length;
  const categories = history.reduce((acc, item) => {
    const cat = item.product?.category || "unknown";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalScans,
    categories,
    exportedAt: new Date().toISOString()
  };
}

function exportToCSV(data: ExportData): Blob {
  const lines: string[] = [];
  
  // En-tête
  lines.push("ECOLOJIA - Export de données");
  lines.push(`Date d'export: ${new Date(data.exportDate).toLocaleString("fr")}`);
  lines.push("");
  
  // Historique
  lines.push("HISTORIQUE D'ANALYSES");
  lines.push("Date,Produit,Marque,Catégorie,Nutri-Score,NOVA,Eco-Score");
  
  data.history.forEach((item) => {
    const p = item.product || {};
    const s = item.score || {};
    const date = (item as any).savedAt || data.exportDate;
    lines.push([
      new Date(date).toLocaleDateString("fr"),
      p.name || "",
      p.brand || "",
      p.category || "",
      s.nutriScore || "",
      s.novaGroup || "",
      s.ecoScore || ""
    ].map(escapeCSV).join(","));
  });
  
  lines.push("");
  
  // Favoris
  lines.push("FAVORIS");
  lines.push("Produit,Marque,Catégorie,Date d'ajout");
  
  data.favorites.forEach((fav) => {
    const p = fav.product || {};
    lines.push([
      p.name || "",
      p.brand || "",
      p.category || "",
      fav.savedAt ? new Date(fav.savedAt).toLocaleDateString("fr") : ""
    ].map(escapeCSV).join(","));
  });
  
  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
}

function exportToHTML(data: ExportData): Blob {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>ECOLOJIA - Export de données</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #059669; }
    h2 { color: #047857; margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: bold; }
    .score-a { background-color: #d1fae5; color: #065f46; }
    .score-b { background-color: #fef3c7; color: #92400e; }
    .score-c { background-color: #fed7aa; color: #9a3412; }
    .score-d { background-color: #fecaca; color: #991b1b; }
    .score-e { background-color: #fee2e2; color: #7f1d1d; }
    .summary { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>ECOLOJIA - Export de données</h1>
  <p>Export généré le ${new Date(data.exportDate).toLocaleString("fr")}</p>
  
  <div class="summary">
    <h2>Résumé</h2>
    <p><strong>Total d'analyses :</strong> ${data.stats.totalScans}</p>
    <p><strong>Nombre de favoris :</strong> ${data.favorites.length}</p>
    <p><strong>Répartition par catégorie :</strong></p>
    <ul>
      ${Object.entries(data.stats.categories)
        .map(([cat, count]) => `<li>${getCategoryName(cat)} : ${count}</li>`)
        .join("")}
    </ul>
  </div>
  
  <h2>Historique des analyses</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Produit</th>
        <th>Marque</th>
        <th>Catégorie</th>
        <th>Nutri-Score</th>
        <th>NOVA</th>
        <th>Eco-Score</th>
      </tr>
    </thead>
    <tbody>
      ${data.history
        .map((item) => {
          const p = item.product || {};
          const s = item.score || {};
          const date = (item as any).savedAt || data.exportDate;
          return `
            <tr>
              <td>${new Date(date).toLocaleDateString("fr")}</td>
              <td>${escapeHTML(p.name || "—")}</td>
              <td>${escapeHTML(p.brand || "—")}</td>
              <td>${getCategoryName(p.category)}</td>
              <td class="score-${(s.nutriScore || "").toLowerCase()}">${s.nutriScore || "—"}</td>
              <td>${s.novaGroup || "—"}</td>
              <td class="score-${(s.ecoScore || "").toLowerCase()}">${s.ecoScore || "—"}</td>
            </tr>
          `;
        })
        .join("")}
    </tbody>
  </table>
  
  <h2>Favoris</h2>
  ${data.favorites.length === 0 ? "<p>Aucun favori enregistré.</p>" : `
    <table>
      <thead>
        <tr>
          <th>Produit</th>
          <th>Marque</th>
          <th>Catégorie</th>
          <th>Date d'ajout</th>
        </tr>
      </thead>
      <tbody>
        ${data.favorites
          .map((fav) => {
            const p = fav.product || {};
            return `
              <tr>
                <td>${escapeHTML(p.name || "—")}</td>
                <td>${escapeHTML(p.brand || "—")}</td>
                <td>${getCategoryName(p.category)}</td>
                <td>${fav.savedAt ? new Date(fav.savedAt).toLocaleDateString("fr") : "—"}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `}
  
  <p style="margin-top: 40px; font-size: 12px; color: #666;">
    Ce document contient vos données personnelles ECOLOJIA. 
    Conservez-le en lieu sûr et ne le partagez qu'avec des personnes de confiance.
  </p>
</body>
</html>`;

  return new Blob([html], { type: "text/html;charset=utf-8" });
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapeHTML(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function getCategoryName(category?: string): string {
  switch (category) {
    case "food": return "Alimentation";
    case "cosmetics": return "Cosmétiques";
    case "detergents": return "Détergents";
    default: return category || "Autre";
  }
}

/**
 * Télécharge le fichier d'export
 */
export async function downloadExport(format: ExportFormat = "json") {
  try {
    const blob = await exportUserData(format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecolojia-export-${new Date().toISOString().split("T")[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    throw error;
  }
}
