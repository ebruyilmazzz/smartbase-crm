import { Router } from 'express';
import { getNotes, createNote, updateNote, deleteNote } from '../controllers/note.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createNoteSchema, updateNoteSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotes);
router.post('/', validate(createNoteSchema), createNote);
router.put('/:id', validate(updateNoteSchema), updateNote);
router.delete('/:id', deleteNote);

export default router;
