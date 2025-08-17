# Frontend viability report - 20250817-183020

- API base: $ApiBase
- Frontend dir: $FrontendDir

| Category | Test | Status | Detail | Duration (ms) |
|---|---|---|---|---|
| deps | node present | PASS | Version: v22.12.0 | 35 |
| deps | npm present | PASS | Version: 10.9.1 | 159 |
| config | VITE_API_URL (CLI) | PASS | http://localhost:10000/api | 0 |
| api | Cosmetics health | FAIL | http://localhost:10000/api/cosmetics/health -> La propriété « success » est introuvable dans cet objet. Vérifiez qu’elle existe. | 84 |
| api | Detergents health | FAIL | http://localhost:10000/api/detergents/health -> La propriété « success » est introuvable dans cet objet. Vérifiez qu’elle existe. | 18 |
| api | Cosmetics analyze | PASS | http://localhost:10000/api/cosmetics/analyze [success=true] | 23 |
| api | Detergents analyze | PASS | http://localhost:10000/api/detergents/analyze [success=true] | 16 |
| api | Food analysis | FAIL | http://localhost:10000/api/analysis -> La propriété « success » est introuvable dans cet objet. Vérifiez qu’elle existe. | 19 |
| api | AI chat | FAIL | http://localhost:10000/api/ai/chat -> Le serveur distant a retourné une erreur : (401) Non autorisé. | 25 |
| build | npm ci | PASS | Dependencies OK | 0 |
| build | npm run build | PASS | Vite build OK in 7,65s | 7655 |
| i18n | UTF-8 encoding | FAIL | Encoding artifacts detected (U+00C2/U+00C3). Fix file encoding. | 4 |
| config | Hardcoded URLs | PASS | None | 5 |
| preview | vite preview | FAIL | Timeout waiting for readiness | 0 |

**Summary** : PASS=8 / WARN=0 / FAIL=6
