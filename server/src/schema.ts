
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  role: z.enum(['author', 'reader']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Auth input schemas
export const registerInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['author', 'reader'])
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100)
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Tag schema
export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type Tag = z.infer<typeof tagSchema>;

export const createTagInputSchema = z.object({
  name: z.string().min(1).max(50)
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

// Blog post schema
export const blogPostSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().nullable(),
  author_id: z.number(),
  category_id: z.number().nullable(),
  status: z.enum(['draft', 'published']),
  published_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BlogPost = z.infer<typeof blogPostSchema>;

export const createBlogPostInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().nullable(),
  category_id: z.number().nullable(),
  status: z.enum(['draft', 'published']),
  tag_ids: z.array(z.number()).optional()
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostInputSchema>;

export const updateBlogPostInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().nullable().optional(),
  category_id: z.number().nullable().optional(),
  status: z.enum(['draft', 'published']).optional(),
  tag_ids: z.array(z.number()).optional()
});

export type UpdateBlogPostInput = z.infer<typeof updateBlogPostInputSchema>;

// Comment schema
export const commentSchema = z.object({
  id: z.number(),
  content: z.string(),
  author_name: z.string(),
  author_email: z.string().email(),
  post_id: z.number(),
  status: z.enum(['pending', 'approved', 'rejected']),
  created_at: z.coerce.date()
});

export type Comment = z.infer<typeof commentSchema>;

export const createCommentInputSchema = z.object({
  content: z.string().min(1).max(1000),
  author_name: z.string().min(1).max(100),
  author_email: z.string().email(),
  post_id: z.number()
});

export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;

export const updateCommentStatusInputSchema = z.object({
  id: z.number(),
  status: z.enum(['pending', 'approved', 'rejected'])
});

export type UpdateCommentStatusInput = z.infer<typeof updateCommentStatusInputSchema>;

// Blog post with relations schema
export const blogPostWithRelationsSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().nullable(),
  author_id: z.number(),
  category_id: z.number().nullable(),
  status: z.enum(['draft', 'published']),
  published_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  author: userSchema,
  category: categorySchema.nullable(),
  tags: z.array(tagSchema),
  comments: z.array(commentSchema)
});

export type BlogPostWithRelations = z.infer<typeof blogPostWithRelationsSchema>;
