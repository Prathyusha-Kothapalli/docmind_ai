const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  listNotes,
  createNote,
  updateNote,
  deleteNote,
  createHighlight,
  deleteHighlight
} = require('../controllers/noteController');

router.use(authenticate);

router.get('/', listNotes);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);
router.post('/highlights', createHighlight);
router.delete('/highlights/:id', deleteHighlight);

module.exports = router;
