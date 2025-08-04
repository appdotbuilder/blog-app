
import { db } from '../db';
import { commentsTable } from '../db/schema';
import { type UpdateCommentStatusInput, type Comment } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCommentStatus = async (input: UpdateCommentStatusInput): Promise<Comment> => {
  try {
    // Update comment status
    const result = await db.update(commentsTable)
      .set({
        status: input.status
      })
      .where(eq(commentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Comment with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Comment status update failed:', error);
    throw error;
  }
};
