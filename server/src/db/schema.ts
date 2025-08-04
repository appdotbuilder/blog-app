
import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['author', 'reader']);
export const postStatusEnum = pgEnum('post_status', ['draft', 'published']);
export const commentStatusEnum = pgEnum('comment_status', ['pending', 'approved', 'rejected']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  email: text('email').notNull(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Tags table
export const tagsTable = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Blog posts table
export const blogPostsTable = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  author_id: integer('author_id').notNull(),
  category_id: integer('category_id'),
  status: postStatusEnum('status').notNull(),
  published_at: timestamp('published_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Post tags junction table
export const postTagsTable = pgTable('post_tags', {
  id: serial('id').primaryKey(),
  post_id: integer('post_id').notNull(),
  tag_id: integer('tag_id').notNull()
});

// Comments table
export const commentsTable = pgTable('comments', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  author_name: text('author_name').notNull(),
  author_email: text('author_email').notNull(),
  post_id: integer('post_id').notNull(),
  status: commentStatusEnum('status').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  posts: many(blogPostsTable)
}));

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  posts: many(blogPostsTable)
}));

export const tagsRelations = relations(tagsTable, ({ many }) => ({
  postTags: many(postTagsTable)
}));

export const blogPostsRelations = relations(blogPostsTable, ({ one, many }) => ({
  author: one(usersTable, {
    fields: [blogPostsTable.author_id],
    references: [usersTable.id]
  }),
  category: one(categoriesTable, {
    fields: [blogPostsTable.category_id],
    references: [categoriesTable.id]
  }),
  postTags: many(postTagsTable),
  comments: many(commentsTable)
}));

export const postTagsRelations = relations(postTagsTable, ({ one }) => ({
  post: one(blogPostsTable, {
    fields: [postTagsTable.post_id],
    references: [blogPostsTable.id]
  }),
  tag: one(tagsTable, {
    fields: [postTagsTable.tag_id],
    references: [tagsTable.id]
  })
}));

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  post: one(blogPostsTable, {
    fields: [commentsTable.post_id],
    references: [blogPostsTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;
export type Tag = typeof tagsTable.$inferSelect;
export type NewTag = typeof tagsTable.$inferInsert;
export type BlogPost = typeof blogPostsTable.$inferSelect;
export type NewBlogPost = typeof blogPostsTable.$inferInsert;
export type PostTag = typeof postTagsTable.$inferSelect;
export type NewPostTag = typeof postTagsTable.$inferInsert;
export type Comment = typeof commentsTable.$inferSelect;
export type NewComment = typeof commentsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  categories: categoriesTable,
  tags: tagsTable,
  blogPosts: blogPostsTable,
  postTags: postTagsTable,
  comments: commentsTable
};
