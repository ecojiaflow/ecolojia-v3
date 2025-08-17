import os
import re
import codecs

def fix_encoding(file_path):
    """Corrige l'encodage d'un fichier"""
    try:
        # Essayer de lire avec différents encodages
        content = None
        for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                break
            except:
                continue
        
        if not content:
            return False
        
        original = content
        
        # === REMPLACEMENTS GÉNÉRAUX ===
        replacements = {
            'Ã©': 'é', 'Ã¨': 'è', 'Ã ': 'à', 'Ã§': 'ç',
            'Ã¢': 'â', 'Ã®': 'î', 'Ã´': 'ô', 'Ã¹': 'ù',
            'Ãª': 'ê', 'Ã‰': 'É', 'Ã€': 'À', 'Ã‡': 'Ç',
            'Ãˆ': 'È', 'ÃŠ': 'Ê', 'Ã‹': 'Ë', 'ÃŽ': 'Î',
            'Ã': 'Ï', 'Ã"': 'Ó', 'Ã"': 'Ô', 'Ã™': 'Ù',
            'Ãœ': 'Ü', 'Å"': 'œ', 'Å'': 'Œ',
            'â€™': "'", 'â€œ': '"', 'â€': '"',
            'â€"': '—', 'â€"': '–', 'â€¦': '...',
            'cosmÃƒÂ©tique': 'cosmétique',
            'hygiÃƒÂ¨ne': 'hygiène',
            'beautÃƒÂ©': 'beauté',
            'BeautÃƒÂ©': 'Beauté',
            'beautÃ©': 'beauté',
            'BeautÃ©': 'Beauté',
            'catÃ©gorie': 'catégorie',
            'CatÃ©gories': 'Catégories',
            'gÃ©nÃ©ral': 'général',
            'GÃ©nÃ©ral': 'Général',
            'prÃ©fÃ©rences': 'préférences',
            'PrÃ©fÃ©rences': 'Préférences',
            'sÃ©lectionner': 'sélectionner',
            'SÃ©lectionner': 'Sélectionner',
            'vÃ©rifier': 'vérifier',
            'VÃ©rifier': 'Vérifier',
            'dÃ©tergents': 'détergents',
            'DÃ©tergents': 'Détergents',
            'Ã©lectronique': 'électronique',
            'Ã‰lectronique': 'Électronique'
        }
        
        for old, new in replacements.items():
            content = content.replace(old, new)
        
        # Nettoyer les longues chaînes corrompues
        content = re.sub(r'ÃƒÆ\'[^\'"\n]*', '', content)
        content = re.sub(r'Ã¢â‚¬[^\'"\n]*', '', content)
        content = re.sub(r'Ãƒâ€[^\'"\n]*', '', content)
        
        # === CORRECTIONS SPÉCIFIQUES ===
        
        # Badge.tsx et Button.tsx
        if 'Badge.tsx' in file_path or 'Button.tsx' in file_path:
            # Corriger les className corrompus
            content = re.sub(r'className=\{[\\\\]+[^}]*\}', 'className={className}', content)
            content = re.sub(r'className=\{\\inline-flex[^}]*\}', 
                           'className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border ${className}`}', 
                           content)
        
        # en.ts
        if 'en.ts' in file_path:
            content = content.replace('← Back to home', '← Back to home')
            content = re.sub(r'We respond within 48h [^\']*welcome', 
                           'We respond within 48h • Suggestions and partnerships welcome', 
                           content)
            content = content.replace('🍪 Essential cookies', '🍪 Essential cookies')
            content = content.replace('📊 Analytics (Plausible)', '📊 Analytics (Plausible)')
        
        # Sauvegarder si modifié
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Corrigé: {file_path}")
            return True
            
    except Exception as e:
        print(f"✗ Erreur: {file_path} - {str(e)}")
    
    return False

# Parcourir tous les fichiers
fixed_count = 0
for root, dirs, files in os.walk('.'):
    # Ignorer certains dossiers
    if 'node_modules' in root or '.git' in root or 'dist' in root:
        continue
    
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.md')):
            file_path = os.path.join(root, file)
            if fix_encoding(file_path):
                fixed_count += 1

print(f"\n✅ Total: {fixed_count} fichiers corrigés")

# Supprimer les BOM
print("\nSuppression des BOM...")
for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root:
        continue
    
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json')):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                if content.startswith(codecs.BOM_UTF8):
                    with open(file_path, 'wb') as f:
                        f.write(content[3:])
                    print(f"BOM supprimé: {file}")
            except:
                pass

print("\n✨ Nettoyage terminé!")
