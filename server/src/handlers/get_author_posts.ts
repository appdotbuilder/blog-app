
import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type BlogPost } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getAuthorPosts = async (authorId: number): Promise<BlogPost[]> => {
  try {
    const results = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.author_id, authorId))
      .orderBy(desc(blogPostsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch author posts:', error);
    throw error;
  }
};
