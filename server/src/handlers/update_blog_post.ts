
import { db } from '../db';
import { blogPostsTable, postTagsTable } from '../db/schema';
import { type UpdateBlogPostInput, type BlogPost } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateBlogPost = async (input: UpdateBlogPostInput, authorId: number): Promise<BlogPost> => {
  try {
    // First verify the post exists and belongs to the author
    const existingPost = await db.select()
      .from(blogPostsTable)
      .where(and(
        eq(blogPostsTable.id, input.id),
        eq(blogPostsTable.author_id, authorId)
      ))
      .execute();

    if (existingPost.length === 0) {
      throw new Error('Blog post not found or access denied');
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.slug !== undefined) {
      updateData.slug = input.slug;
    }
    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    if (input.excerpt !== undefined) {
      updateData.excerpt = input.excerpt;
    }
    if (input.category_id !== undefined) {
      updateData.category_id = input.category_id;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
      // Set published_at when status changes to published
      if (input.status === 'published' && existingPost[0].status !== 'published') {
        updateData.published_at = new Date();
      }
      // Clear published_at when status changes to draft
      if (input.status === 'draft') {
        updateData.published_at = null;
      }
    }

    // Update the blog post
    const result = await db.update(blogPostsTable)
      .set(updateData)
      .where(eq(blogPostsTable.id, input.id))
      .returning()
      .execute();

    // Handle tag associations if provided
    if (input.tag_ids !== undefined) {
      // Delete existing tag associations
      await db.delete(postTagsTable)
        .where(eq(postTagsTable.post_id, input.id))
        .execute();

      // Insert new tag associations
      if (input.tag_ids.length > 0) {
        const tagAssociations = input.tag_ids.map(tagId => ({
          post_id: input.id,
          tag_id: tagId
        }));
        
        await db.insert(postTagsTable)
          .values(tagAssociations)
          .execute();
      }
    }

    return result[0];
  } catch (error) {
    console.error('Blog post update failed:', error);
    throw error;
  }
};
