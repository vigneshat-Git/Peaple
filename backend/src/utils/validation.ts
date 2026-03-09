import Joi from 'joi';

export const validationSchemas = {
  // Auth schemas
  register: Joi.object({
    username: Joi.string().pattern(/^[a-zA-Z0-9]+$/).min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Post schemas
  createPost: Joi.object({
    title: Joi.string().min(5).max(300).required(),
    content: Joi.string().min(10).required(),
    community_id: Joi.string().uuid().required(),
    media_url: Joi.string().uri().optional(),
  }),

  updatePost: Joi.object({
    title: Joi.string().min(5).max(300),
    content: Joi.string().min(10),
    media_url: Joi.string().uri().optional(),
  }),

  // Comment schemas
  createComment: Joi.object({
    content: Joi.string().min(1).max(5000).required(),
    parent_comment_id: Joi.string().uuid().optional(),
  }),

  // Community schemas
  createCommunity: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(500).required(),
    icon_url: Joi.string().uri().optional(),
    banner_url: Joi.string().uri().optional(),
  }),

  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

export function validate(data: any, schema: Joi.Schema) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map((d) => d.message).join(', ');
    throw new Error(`Validation error: ${messages}`);
  }

  return value;
}

export function validateRequest(schema: Joi.Schema) {
  return (data: any) => validate(data, schema);
}
