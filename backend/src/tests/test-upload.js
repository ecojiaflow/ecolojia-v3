const express = require('express');
const multer = require('multer');
const cors = require('cors');
const app = express();

// Activer CORS pour tous les origines
app.use(cors());

// Si cors n'est pas installé, utiliser ceci à la place :
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/test/upload', upload.single('image'), (req, res) => {
  console.log('Headers:', req.headers);
  console.log('File:', req.file ? 'PRESENT' : 'NO FILE');

  if (!req.file) {
    return res.status(400).json({ 
      error: 'Aucune image fournie',
      debug: { headers: req.headers }
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

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Test server on port ${PORT} with CORS enabled`);
});
