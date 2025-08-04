
import { db } from '../db';
import { blogPostsTable, postTagsTable, usersTable, categoriesTable, tagsTable } from '../db/schema';
import { type CreateBlogPostInput, type BlogPost } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const createBlogPost = async (input: CreateBlogPostInput, authorId: number): Promise<BlogPost> => {
  try {
    // Check if author exists
    const author = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, authorId))
      .execute();
    
    if (author.length === 0) {
      throw new Error('Author not found');
    }

    // Check if category exists (if provided)
    if (input.category_id) {
      const category = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();
      
      if (category.length === 0) {
        throw new Error('Category not found');
      }
    }

    // Check if all tags exist (if provided)
    if (input.tag_ids && input.tag_ids.length > 0) {
      const existingTags = await db.select()
        .from(tagsTable)
        .where(inArray(tagsTable.id, input.tag_ids))
        .execute();
      
      if (existingTags.length !== input.tag_ids.length) {
        throw new Error('One or more tags not found');
      }
    }

    // Create blog post
    const publishedAt = input.status === 'published' ? new Date() : null;
    
    const result = await db.insert(blogPostsTable)
      .values({
        title: input.title,
        slug: input.slug,
        content: input.content,
        excerpt: input.excerpt,
        author_id: authorId,
        category_id: input.category_id,
        status: input.status,
        published_at: publishedAt
      })
      .returning()
      .execute();

    const blogPost = result[0];

    // Create post-tag associations if tags were provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      const postTagValues = input.tag_ids.map(tagId => ({
        post_id: blogPost.id,
        tag_id: tagId
      }));

      await db.insert(postTagsTable)
        .values(postTagValues)
        .execute();
    }

    return blogPost;
  } catch (error) {
    console.error('Blog post creation failed:', error);
    throw error;
  }
};
