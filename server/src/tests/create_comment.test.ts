
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { commentsTable, usersTable, blogPostsTable } from '../db/schema';
import { type CreateCommentInput } from '../schema';
import { createComment } from '../handlers/create_comment';
import { eq } from 'drizzle-orm';

// Test input for creating a comment
const testInput: CreateCommentInput = {
  content: 'This is a great blog post! Very informative.',
  author_name: 'John Doe',
  author_email: 'john.doe@example.com',
  post_id: 1
};

describe('createComment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create prerequisite data
  const createTestData = async () => {
    // Create a test user (author)
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@example.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();

    // Create a test blog post
    const postResult = await db.insert(blogPostsTable)
      .values({
        title: 'Test Blog Post',
        slug: 'test-blog-post',
        content: 'This is test content for the blog post.',
        excerpt: 'Test excerpt',
        author_id: userResult[0].id,
        status: 'published'
      })
      .returning()
      .execute();

    return { user: userResult[0], post: postResult[0] };
  };

  it('should create a comment with pending status', async () => {
    await createTestData();
    
    const result = await createComment(testInput);

    // Basic field validation
    expect(result.content).toEqual('This is a great blog post! Very informative.');
    expect(result.author_name).toEqual('John Doe');
    expect(result.author_email).toEqual('john.doe@example.com');
    expect(result.post_id).toEqual(1);
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save comment to database', async () => {
    await createTestData();
    
    const result = await createComment(testInput);

    // Query the database to verify the comment was saved
    const comments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, result.id))
      .execute();

    expect(comments).toHaveLength(1);
    expect(comments[0].content).toEqual('This is a great blog post! Very informative.');
    expect(comments[0].author_name).toEqual('John Doe');
    expect(comments[0].author_email).toEqual('john.doe@example.com');
    expect(comments[0].post_id).toEqual(1);
    expect(comments[0].status).toEqual('pending');
    expect(comments[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when blog post does not exist', async () => {
    const invalidInput: CreateCommentInput = {
      ...testInput,
      post_id: 999 // Non-existent post ID
    };

    await expect(createComment(invalidInput)).rejects.toThrow(/Blog post with id 999 not found/i);
  });

  it('should create multiple comments for the same post', async () => {
    await createTestData();

    const comment1 = await createComment(testInput);
    const comment2 = await createComment({
      ...testInput,
      content: 'Another great comment!',
      author_name: 'Jane Smith',
      author_email: 'jane.smith@example.com'
    });

    expect(comment1.id).not.toEqual(comment2.id);
    expect(comment1.post_id).toEqual(comment2.post_id);
    expect(comment1.status).toEqual('pending');
    expect(comment2.status).toEqual('pending');

    // Verify both comments are in the database
    const allComments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.post_id, 1))
      .execute();

    expect(allComments).toHaveLength(2);
  });
});
