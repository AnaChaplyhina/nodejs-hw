import Joi from 'joi';

export const registerUserSchema = {
  body: Joi.object({
    username: Joi.string().trim().optional(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).required(),
  }),
};

export const loginUserSchema = {
  body: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required(),
  }),
};

export const requestResetEmailSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

export const resetPasswordSchema = {
  body: Joi.object({
    password: Joi.string().required(),
    token: Joi.string().required(),
  }),
};
