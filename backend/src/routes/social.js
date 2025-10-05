const express = require('express');
const router = express.Router();
const db = require('../utils/database');

// Get posts
router.get('/posts', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, u.name as author_name
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT 20
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create post
router.post('/posts', async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;

    // NDA filter
    const ndaRegex = /nda|confidential|secret/i;
    if (ndaRegex.test(title + ' ' + content)) {
      return res.status(400).json({ error: 'NDA content detected' });
    }

    const result = await db.query(`
      INSERT INTO posts (author_id, title, content, tags)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, ['00000000-0000-0000-0000-000000000001', title, content, JSON.stringify(tags)]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
