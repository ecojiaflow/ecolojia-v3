# ECOLOJIA V3 - Production

## 🌐 URLs de Production

- **Frontend** : https://frontendvf.netlify.app
- **Backend API** : https://ecolojia-backendvf.onrender.com
- **Santé API** : https://ecolojia-backendvf.onrender.com/api/health

## 🚀 Features Actives

- ✅ Scanner de produits (code-barres)
- ✅ Recherche Algolia instantanée
- ✅ Scoring (NOVA, Nutri-Score, Eco-Score)
- ✅ OCR pour analyser les ingrédients
- ✅ PWA installable
- ✅ Paiements LemonSqueezy

## 📊 Monitoring

- UptimeRobot surveille /api/health et /api/algolia/search
- Logs disponibles sur Render Dashboard
- Analytics Netlify pour le trafic frontend

## 🔧 Maintenance

Pour déployer des changements :
1. Développer sur branche `develop`
2. Tester en local
3. Merger dans `main`
4. Déploiement automatique sur push

## 📞 Support

- Logs backend : Render Dashboard → Logs
- Erreurs frontend : Netlify → Functions logs
- Base de données : MongoDB Atlas
