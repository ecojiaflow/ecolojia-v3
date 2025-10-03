# Workflow Git

## Branches
- `main` : Production (auto-deploy)
- `staging` : Tests pré-production
- `develop` : Développement actif
- `feature/*` : Nouvelles fonctionnalités

## Process
1. Créer feature depuis develop
2. PR vers develop
3. Merge develop → staging pour tests
4. Merge staging → main pour production
