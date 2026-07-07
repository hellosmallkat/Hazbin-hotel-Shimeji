/* Minimal Express server to serve the static site and provide an API to persist character accents.
   Usage:
     - create a .env file with ADMIN_SECRET=yourSecret
     - npm install
     - npm start
*/

const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const ADMIN_SECRET = process.env.ADMIN_SECRET || null;
if (!ADMIN_SECRET) {
  console.warn('Warning: ADMIN_SECRET not set. The /api/save-accent endpoint will reject requests. Set ADMIN_SECRET in .env to enable.');
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files from current directory
app.use(express.static(process.cwd()));

// API to update characters.json accents
app.post('/api/save-accent', (req, res) => {
  const { id, accent, accentDark, secret } = req.body || {};
  if (!ADMIN_SECRET) return res.status(500).json({ message: 'Server not configured with ADMIN_SECRET' });
  if (!secret || secret !== ADMIN_SECRET) return res.status(403).json({ message: 'Invalid admin secret' });
  if (!id) return res.status(400).json({ message: 'Missing character id' });

  const file = path.join(process.cwd(), 'characters.json');
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const arr = JSON.parse(raw);
    const idx = arr.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Character not found' });
    // update fields
    if (accent) arr[idx].accent = accent;
    if (accentDark) arr[idx].accentDark = accentDark;
    fs.writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');
    return res.json({ ok: true, id, accent: arr[idx].accent, accentDark: arr[idx].accentDark });
  } catch (e) {
    console.error('Error updating characters.json', e);
    return res.status(500).json({ message: 'Failed to update characters.json' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
