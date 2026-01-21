import { Router } from 'express';
import { celebrate } from 'celebrate';
import {
  createNote,
  deleteNote,
  getAllNotes,
  getNoteById,
  updateNote,
} from '../controllers/notesController.js';
import {
  createNoteSchema,
  getAllNotesSchema,
  noteIdSchema,
  updateNoteSchema,
} from '../validations/notesValidation.js';

const router = Router();

router.get(
  '/notes',
  celebrate({
    query: getAllNotesSchema,
  }),
  getAllNotes,
);

router.get(
  '/notes/:noteId',
  celebrate({
    params: noteIdSchema,
  }),
  getNoteById,
);

router.post(
  '/notes',
  celebrate({
    body: createNoteSchema,
  }),
  createNote,
);


router.patch('/notes/:noteId', celebrate(updateNoteSchema), updateNote);

router.delete(
  '/notes/:noteId',
  celebrate({
    params: noteIdSchema,
  }),
  deleteNote,
);

export default router;
