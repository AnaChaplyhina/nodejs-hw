import Joi from 'joi';
import { isValidObjectId } from 'mongoose';
import { TAGS } from '../constants/tags.js';

const validateObjectId = (value, helpers) => {
  if (!isValidObjectId(value)) {
    return helpers.message('"{{#label}}" must be a valid MongoDB ObjectId');
  }
  return value;
};

export const createNoteSchema = Joi.object({
  title: Joi.string().min(1).max(30).required(),
  content: Joi.string().allow('').optional(),
  tag: Joi.string()
    .valid(...TAGS)
    .optional(),
});

export const getAllNotesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  perPage: Joi.number().integer().min(5).max(20).default(10),
  tag: Joi.string()
    .valid(...TAGS)
    .optional(),
  search: Joi.string().allow('').optional(),
});

export const noteIdSchema = Joi.object({
  noteId: Joi.string().custom(validateObjectId, 'ObjectId validation').required(),
});

export const updateNoteSchema = Joi.object({
  title: Joi.string().min(1).max(30).optional(),
  content: Joi.string().allow('').optional(),
  tag: Joi.string()
    .valid(...TAGS)
    .optional(),
})
  .min(1)
  .message('Body must have at least one field');
