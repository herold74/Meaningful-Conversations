const express = require('express');
const path = require('path');
const app = express();

// Cloud Run provides the PORT environment variable.
// Default to 8080 for local testing if PORT is not set.
const port = process.env.PORT || 8080;

// Serve the static files from the Vite build output directory 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// For a Single Page Application (SPA), all other routes should fall back to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Frontend server is running on port ${port}`);
});
