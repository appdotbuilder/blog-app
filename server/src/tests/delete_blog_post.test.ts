
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, tagsTable, blogPostsTable, postTagsTable, commentsTable } from '../db/schema';
import { deleteBlogPost } from '../handlers/delete_blog_post';
import { eq } from 'drizzle-orm';

describe('deleteBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a blog post owned by the author', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();
    const authorId = users[0].id;

    // Create test blog post
    const posts = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        author_id: authorId,
        status: 'published'
      })
      .returning()
      .execute();
    const postId = posts[0].id;

    // Delete the post
    const result = await deleteBlogPost(postId, authorId);

    expect(result).toBe(true);

    // Verify post is deleted
    const remainingPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, postId))
      .execute();

    expect(remainingPosts).toHaveLength(0);
  });

  it('should delete related data when deleting a blog post', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();
    const authorId = users[0].id;

    // Create test tag
    const tags = await db.insert(tagsTable)
      .values({ name: 'Test Tag' })
      .returning()
      .execute();
    const tagId = tags[0].id;

    // Create test blog post
    const posts = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        author_id: authorId,
        status: 'published'
      })
      .returning()
      .execute();
    const postId = posts[0].id;

    // Create post-tag relationship
    await db.insert(postTagsTable)
      .values({
        post_id: postId,
        tag_id: tagId
      })
      .execute();

    // Create test comment
    await db.insert(commentsTable)
      .values({
        content: 'Test comment',
        author_name: 'Commenter',
        author_email: 'commenter@test.com',
        post_id: postId,
        status: 'approved'
      })
      .execute();

    // Delete the post
    const result = await deleteBlogPost(postId, authorId);

    expect(result).toBe(true);

    // Verify post-tag relationships are deleted
    const remainingPostTags = await db.select()
      .from(postTagsTable)
      .where(eq(postTagsTable.post_id, postId))
      .execute();

    expect(remainingPostTags).toHaveLength(0);

    // Verify comments are deleted
    const remainingComments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.post_id, postId))
      .execute();

    expect(remainingComments).toHaveLength(0);

    // Verify the tag itself still exists (should not be deleted)
    const remainingTags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tagId))
      .execute();

    expect(remainingTags).toHaveLength(1);
  });

  it('should return false when post does not exist', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();
    const authorId = users[0].id;

    // Try to delete non-existent post
    const result = await deleteBlogPost(999, authorId);

    expect(result).toBe(false);
  });

  it('should return false when post is not owned by the author', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'author1',
          email: 'author1@test.com',
          password_hash: 'hashedpassword',
          role: 'author'
        },
        {
          username: 'author2',
          email: 'author2@test.com',
          password_hash: 'hashedpassword',
          role: 'author'
        }
      ])
      .returning()
      .execute();
    const author1Id = users[0].id;
    const author2Id = users[1].id;

    // Create blog post owned by author1
    const posts = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        author_id: author1Id,
        status: 'published'
      })
      .returning()
      .execute();
    const postId = posts[0].id;

    // Try to delete with author2 (wrong owner)
    const result = await deleteBlogPost(postId, author2Id);

    expect(result).toBe(false);

    // Verify post still exists
    const remainingPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, postId))
      .execute();

    expect(remainingPosts).toHaveLength(1);
  });
});
