@echo off
REM ===================================================================
REM ECOLOJIA V3 - SCRIPT DE DÉMARRAGE WINDOWS
REM ===================================================================

echo.
echo ====================================
echo    ECOLOJIA V3 - STARTUP SCRIPT
echo ====================================
echo.

REM --- 1. INSTALLATION DES DÉPENDANCES ---
echo [1/6] Installation des dependances...
echo.

echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 goto :error

echo.
echo Installing frontend dependencies...
cd ../frontend
call npm install
if errorlevel 1 goto :error
cd ..

REM --- 2. DÉMARRAGE REDIS ---
echo.
echo [2/6] Demarrage Redis...
echo.

REM Vérifier si Redis est installé
where redis-server >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Redis n'est pas installe!
    echo.
    echo Telechargez Redis pour Windows:
    echo https://github.com/microsoftarchive/redis/releases
    echo.
    echo Ou utilisez Docker:
    echo docker run -d -p 6379:6379 --name ecolojia-redis redis:alpine
    echo.
    pause
    goto :skipredis
)

REM Démarrer Redis
start "Redis Server" redis-server
echo ✅ Redis demarre sur le port 6379
timeout /t 2 >nul

:skipredis

REM --- 3. DÉMARRAGE MONGODB ---
echo.
echo [3/6] Verification MongoDB...
echo.

REM Vérifier si MongoDB est en cours d'exécution
sc query MongoDB >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  MongoDB n'est pas en cours d'execution!
    echo.
    echo Demarrez MongoDB manuellement ou utilisez MongoDB Atlas
    echo.
    pause
)

REM --- 4. VARIABLES D'ENVIRONNEMENT ---
echo.
echo [4/6] Configuration environnement...
echo.

if not exist backend\.env (
    echo.
    echo ⚠️  Fichier backend\.env manquant!
    echo Creation depuis .env.example...
    copy backend\.env.example backend\.env
    echo.
    echo ⚠️  IMPORTANT: Editez backend\.env avec vos cles API!
    echo.
    notepad backend\.env
    pause
)

if not exist frontend\.env (
    echo.
    echo ⚠️  Fichier frontend\.env manquant!
    echo Creation depuis .env.example...
    copy frontend\.env.example frontend\.env
)

REM --- 5. BUILD FRONTEND (OPTIONNEL) ---
echo.
echo [5/6] Build frontend (optionnel)...
echo.
choice /C YN /M "Voulez-vous builder le frontend pour la production"
if errorlevel 2 goto :skipbuild

cd frontend
call npm run build
cd ..
echo ✅ Build frontend complete

:skipbuild

REM --- 6. DÉMARRAGE DES SERVEURS ---
echo.
echo [6/6] Demarrage des serveurs...
echo.

REM Backend (port 5000)
start "ECOLOJIA Backend" cmd /k "cd backend && npm run dev"
echo ✅ Backend demarre sur http://localhost:5000

timeout /t 3 >nul

REM Frontend (port 3000)
start "ECOLOJIA Frontend" cmd /k "cd frontend && npm start"
echo ✅ Frontend demarre sur http://localhost:3000

REM Worker (optionnel)
choice /C YN /M "Demarrer le worker de taches de fond"
if errorlevel 2 goto :skipworker
start "ECOLOJIA Worker" cmd /k "cd backend && npm run worker"
echo ✅ Worker demarre

:skipworker

echo.
echo ====================================
echo    ECOLOJIA V3 - RUNNING
echo ====================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo Redis:    localhost:6379
echo MongoDB:  localhost:27017
echo.
echo Logs dans les fenetres separees
echo.
echo Appuyez sur une touche pour ouvrir le navigateur...
pause >nul

start http://localhost:3000

goto :end

:error
echo.
echo ❌ ERREUR: L'installation a echoue!
echo.
pause

:end