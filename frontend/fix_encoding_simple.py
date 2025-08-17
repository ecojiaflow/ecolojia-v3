import os
import re

def fix_encoding(file_path):
    """Corrige l'encodage d'un fichier"""
    try:
        # Lire le fichier
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        original = content
        
        # Remplacements de base
        replacements = {
            'Ã©': 'é', 'Ã¨': 'è', 'Ã ': 'à', 'Ã§': 'ç',
            'Ã¢': 'â', 'Ã®': 'î', 'Ã´': 'ô', 'Ã¹': 'ù',
            'Ãª': 'ê', 'Ã‰': 'É', 'Ã€': 'À', 'Ã‡': 'Ç',
            'cosmÃƒÂ©tique': 'cosmétique',
            'hygiÃƒÂ¨ne': 'hygiène',
            'beautÃƒÂ©': 'beauté',
            'BeautÃƒÂ©': 'Beauté',
            'beautÃ©': 'beauté',
            'BeautÃ©': 'Beauté'
        }
        
        for old, new in replacements.items():
            content = content.replace(old, new)
        
        # Sauvegarder si modifié
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {file_path}")
            return True
            
    except Exception as e:
        print(f"Error: {file_path} - {str(e)}")
    
    return False

# Parcourir tous les fichiers
fixed_count = 0
for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or 'dist' in root:
        continue
    
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
            file_path = os.path.join(root, file)
            if fix_encoding(file_path):
                fixed_count += 1

print(f"\nTotal: {fixed_count} files fixed")
