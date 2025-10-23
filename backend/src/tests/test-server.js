const express = require('express');
const multer = require('multer');
const app = express();

// Page de test intÃ©grÃ©e
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Test Upload ECOLOJIA</title>
    <style>
        body { font-family: Arial; padding: 20px; max-width: 600px; margin: auto; }
        .result { margin-top: 20px; padding: 15px; border-radius: 5px; }
        .error { background: #ffe0e0; color: #d00; }
        .success { background: #e0ffe0; color: #060; }
        pre { white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1>Test Upload ECOLOJIA</h1>
    <p>Port: ${PORT}</p>
    <input type="file" id="file" accept="image/*">
    <button onclick="testUpload()">Upload</button>
    <div id="result"></div>

    <script>
        async function testUpload() {
            const file = document.getElementById('file').files[0];
            if (!file) return alert('Choisir un fichier');
            
            document.getElementById('result').innerHTML = '<div class="result">Upload en cours...</div>';
            
            const formData = new FormData();
            formData.append('image', file);
            
            try {
                const res = await fetch('/test/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                document.getElementById('result').className = res.ok ? 'result success' : 'result error';
                document.getElementById('result').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            } catch (e) {
                document.getElementById('result').className = 'result error';
                document.getElementById('result').innerHTML = 'Erreur: ' + e.message;
            }
        }
    </script>
</body>
</html>
  `);
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/test/upload', upload.single('image'), (req, res) => {
  console.log('=== UPLOAD TEST ===');
  console.log('File:', req.file ? 'PRESENT' : 'NO FILE');
  if (req.file) {
    console.log('Details:', {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });
  }

  if (!req.file) {
    return res.status(400).json({ 
      error: 'Aucune image fournie'
    });
  }

  res.json({ 
    success: true, 
    file: {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    }
  });
});

const PORT = 5003;
app.listen(PORT, () => {
  console.log(`Test server: http://localhost:${PORT}`);
});
