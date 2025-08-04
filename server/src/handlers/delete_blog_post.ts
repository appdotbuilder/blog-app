
import { db } from '../db';
import { blogPostsTable, postTagsTable, commentsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const deleteBlogPost = async (postId: number, authorId: number): Promise<boolean> => {
  try {
    // First verify the post exists and belongs to the author
    const post = await db.select()
      .from(blogPostsTable)
      .where(and(
        eq(blogPostsTable.id, postId),
        eq(blogPostsTable.author_id, authorId)
      ))
      .execute();

    if (post.length === 0) {
      return false; // Post not found or not owned by author
    }

    // Delete related data first (foreign key constraints)
    // Delete post-tag relationships
    await db.delete(postTagsTable)
      .where(eq(postTagsTable.post_id, postId))
      .execute();

    // Delete comments on the post
    await db.delete(commentsTable)
      .where(eq(commentsTable.post_id, postId))
      .execute();

    // Finally delete the blog post itself
    const result = await db.delete(blogPostsTable)
      .where(and(
        eq(blogPostsTable.id, postId),
        eq(blogPostsTable.author_id, authorId)
      ))
      .execute();

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Blog post deletion failed:', error);
    throw error;
  }
};
