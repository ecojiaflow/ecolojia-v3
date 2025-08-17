import os
import re

def fix_file(filepath):
    try:
        # Lire avec différents encodages
        content = None
        for encoding in ['utf-8', 'latin-1', 'cp1252']:
            try:
                with open(filepath, 'r', encoding=encoding) as f:
                    content = f.read()
                break
            except:
                continue
        
        if not content:
            return False
            
        # Remplacements
        replacements = {
            'beautÃƒÂ©': 'beauté',
            'BeautÃƒÂ©': 'Beauté',
            'beautÃ©': 'beauté', 
            'BeautÃ©': 'Beauté',
            'ÃƒÆ'Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°lectronique': 'Électronique',
            'ÃƒÆ'Ã¢â‚¬Â°lectronique': 'Électronique',
            'Ã‰lectronique': 'Électronique'
        }
        
        modified = False
        for old, new in replacements.items():
            if old in content:
                content = content.replace(old, new)
                modified = True
        
        # Corrections générales
        content = re.sub(r'Ã©', 'é', content)
        content = re.sub(r'Ã¨', 'è', content)
        content = re.sub(r'Ã ', 'à', content)
        content = re.sub(r'Ã§', 'ç', content)
        
        if modified or 'Ã' in content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Corrigé: {filepath}")
            return True
    except Exception as e:
        print(f"Erreur: {filepath} - {e}")
    return False

# Parcourir tous les fichiers
count = 0
for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json')):
            filepath = os.path.join(root, file)
            if fix_file(filepath):
                count += 1

print(f"\nTotal: {count} fichiers corrigés")
