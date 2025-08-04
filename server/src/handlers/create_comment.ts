
import { db } from '../db';
import { commentsTable, blogPostsTable } from '../db/schema';
import { type CreateCommentInput, type Comment } from '../schema';
import { eq } from 'drizzle-orm';

export const createComment = async (input: CreateCommentInput): Promise<Comment> => {
  try {
    // Verify the blog post exists before creating the comment
    const existingPost = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, input.post_id))
      .execute();

    if (existingPost.length === 0) {
      throw new Error(`Blog post with id ${input.post_id} not found`);
    }

    // Insert comment record with 'pending' status for moderation
    const result = await db.insert(commentsTable)
      .values({
        content: input.content,
        author_name: input.author_name,
        author_email: input.author_email,
        post_id: input.post_id,
        status: 'pending' // Default status for new comments
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Comment creation failed:', error);
    throw error;
  }
};
