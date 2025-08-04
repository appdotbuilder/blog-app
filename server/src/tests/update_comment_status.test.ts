
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, blogPostsTable, commentsTable } from '../db/schema';
import { type UpdateCommentStatusInput } from '../schema';
import { updateCommentStatus } from '../handlers/update_comment_status';
import { eq } from 'drizzle-orm';

describe('updateCommentStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update comment status from pending to approved', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@example.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();

    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category'
      })
      .returning()
      .execute();

    const [post] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        excerpt: 'Test excerpt',
        author_id: user.id,
        category_id: category.id,
        status: 'published',
        published_at: new Date()
      })
      .returning()
      .execute();

    const [comment] = await db.insert(commentsTable)
      .values({
        content: 'Test comment content',
        author_name: 'Commenter',
        author_email: 'commenter@example.com',
        post_id: post.id,
        status: 'pending'
      })
      .returning()
      .execute();

    const input: UpdateCommentStatusInput = {
      id: comment.id,
      status: 'approved'
    };

    const result = await updateCommentStatus(input);

    expect(result.id).toEqual(comment.id);
    expect(result.status).toEqual('approved');
    expect(result.content).toEqual('Test comment content');
    expect(result.author_name).toEqual('Commenter');
    expect(result.author_email).toEqual('commenter@example.com');
    expect(result.post_id).toEqual(post.id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update comment status from pending to rejected', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@example.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();

    const [post] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        excerpt: 'Test excerpt',
        author_id: user.id,
        category_id: null,
        status: 'published',
        published_at: new Date()
      })
      .returning()
      .execute();

    const [comment] = await db.insert(commentsTable)
      .values({
        content: 'Inappropriate comment',
        author_name: 'Spammer',
        author_email: 'spam@example.com',
        post_id: post.id,
        status: 'pending'
      })
      .returning()
      .execute();

    const input: UpdateCommentStatusInput = {
      id: comment.id,
      status: 'rejected'
    };

    const result = await updateCommentStatus(input);

    expect(result.status).toEqual('rejected');
    expect(result.id).toEqual(comment.id);
  });

  it('should save status change to database', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@example.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();

    const [post] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        excerpt: 'Test excerpt',
        author_id: user.id,
        category_id: null,
        status: 'published',
        published_at: new Date()
      })
      .returning()
      .execute();

    const [comment] = await db.insert(commentsTable)
      .values({
        content: 'Test comment',
        author_name: 'Commenter',
        author_email: 'commenter@example.com',
        post_id: post.id,
        status: 'pending'
      })
      .returning()
      .execute();

    const input: UpdateCommentStatusInput = {
      id: comment.id,
      status: 'approved'
    };

    await updateCommentStatus(input);

    // Verify the change was persisted
    const updatedComments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, comment.id))
      .execute();

    expect(updatedComments).toHaveLength(1);
    expect(updatedComments[0].status).toEqual('approved');
    expect(updatedComments[0].content).toEqual('Test comment');
  });

  it('should throw error when comment does not exist', async () => {
    const input: UpdateCommentStatusInput = {
      id: 999,
      status: 'approved'
    };

    await expect(updateCommentStatus(input)).rejects.toThrow(/Comment with id 999 not found/i);
  });
});
