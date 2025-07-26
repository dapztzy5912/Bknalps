const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('public/uploads')) {
  fs.mkdirSync('public/uploads', { recursive: true });
}

// API endpoint to generate the redirect JPG
app.post('/generate-redirect', upload.single('image'), (req, res) => {
  try {
    const { redirectUrl } = req.body;
    const imagePath = req.file.path;

    if (!redirectUrl) {
      return res.status(400).json({ error: 'Redirect URL is required' });
    }

    // Read the image as base64
    const imageData = fs.readFileSync(imagePath, { encoding: 'base64' });

    // Create HTML with redirect
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <meta http-equiv='refresh' content='0;url=${redirectUrl}'>
  <script>window.location.href='${redirectUrl}';</script>
  <title>Redirecting to Portfolio</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      text-align: center; 
      padding: 50px; 
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Redirecting to Portfolio</h1>
    <img src="data:image/jpeg;base64,${imageData}" style="max-width: 100%; height: auto; margin: 20px 0;">
    <p>You are being redirected to the portfolio website.</p>
    <p>If you are not redirected automatically, <a href="${redirectUrl}">click here</a>.</p>
  </div>
</body>
</html>`;

    // Create a unique filename
    const outputFilename = `portfolio-redirect-${Date.now()}.jpg`;
    const outputPath = path.join('public', 'downloads', outputFilename);

    // Create downloads directory if it doesn't exist
    if (!fs.existsSync('public/downloads')) {
      fs.mkdirSync('public/downloads', { recursive: true });
    }

    // Save the HTML as a JPG file (technically HTML with .jpg extension)
    fs.writeFileSync(outputPath, htmlContent);

    // Send the download link back to the client
    res.json({ 
      downloadUrl: `/downloads/${outputFilename}`,
      filename: outputFilename
    });

  } catch (error) {
    console.error('Error generating redirect:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
