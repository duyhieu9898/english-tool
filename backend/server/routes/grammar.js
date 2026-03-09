const { Router } = require('express');
const { loadGrammar } = require('../db/contentDb');

const router = Router();

router.get('/', (req, res) => {
  let grammar = loadGrammar();
  if (req.query.level) grammar = grammar.filter(g => g.level === req.query.level);
  res.setHeader('X-Total-Count', grammar.length);
  res.json(grammar);
});

router.get('/:id', (req, res) => {
  const grammar = loadGrammar();
  const item = grammar.find(g => String(g.id) === req.params.id || g.slug === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

module.exports = router;
