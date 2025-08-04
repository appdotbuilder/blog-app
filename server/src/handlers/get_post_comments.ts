
import { db } from '../db';
import { commentsTable } from '../db/schema';
import { type Comment } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getPostComments = async (postId: number): Promise<Comment[]> => {
  try {
    // Fetch all approved comments for the specified post
    const results = await db.select()
      .from(commentsTable)
      .where(
        and(
          eq(commentsTable.post_id, postId),
          eq(commentsTable.status, 'approved')
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch post comments:', error);
    throw error;
  }
};
