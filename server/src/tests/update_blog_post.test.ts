
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, tagsTable, blogPostsTable, postTagsTable } from '../db/schema';
import { type UpdateBlogPostInput } from '../schema';
import { updateBlogPost } from '../handlers/update_blog_post';
import { eq } from 'drizzle-orm';

describe('updateBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let authorId: number;
  let otherAuthorId: number;
  let categoryId: number;
  let tagIds: number[];
  let postId: number;

  beforeEach(async () => {
    // Create test author
    const authorResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();
    authorId = authorResult[0].id;

    // Create another author for access control tests
    const otherAuthorResult = await db.insert(usersTable)
      .values({
        username: 'otherauthor',
        email: 'other@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();
    otherAuthorId = otherAuthorResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create test tags
    const tag1Result = await db.insert(tagsTable)
      .values({ name: 'Tag 1' })
      .returning()
      .execute();
    const tag2Result = await db.insert(tagsTable)
      .values({ name: 'Tag 2' })
      .returning()
      .execute();
    tagIds = [tag1Result[0].id, tag2Result[0].id];

    // Create test blog post
    const postResult = await db.insert(blogPostsTable)
      .values({
        title: 'Original Title',
        slug: 'original-slug',
        content: 'Original content',
        excerpt: 'Original excerpt',
        author_id: authorId,
        category_id: categoryId,
        status: 'draft'
      })
      .returning()
      .execute();
    postId = postResult[0].id;

    // Add initial tag associations
    await db.insert(postTagsTable)
      .values([
        { post_id: postId, tag_id: tagIds[0] }
      ])
      .execute();
  });

  it('should update basic blog post fields', async () => {
    const input: UpdateBlogPostInput = {
      id: postId,
      title: 'Updated Title',
      content: 'Updated content',
      excerpt: 'Updated excerpt'
    };

    const result = await updateBlogPost(input, authorId);

    expect(result.id).toBe(postId);
    expect(result.title).toBe('Updated Title');
    expect(result.content).toBe('Updated content');
    expect(result.excerpt).toBe('Updated excerpt');
    expect(result.author_id).toBe(authorId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const input: UpdateBlogPostInput = {
      id: postId,
      title: 'New Title Only'
    };

    const result = await updateBlogPost(input, authorId);

    expect(result.title).toBe('New Title Only');
    expect(result.content).toBe('Original content'); // Should remain unchanged
    expect(result.excerpt).toBe('Original excerpt'); // Should remain unchanged
  });

  it('should update category', async () => {
    // Create new category
    const newCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'New Category',
        slug: 'new-category'
      })
      .returning()
      .execute();

    const input: UpdateBlogPostInput = {
      id: postId,
      category_id: newCategoryResult[0].id
    };

    const result = await updateBlogPost(input, authorId);

    expect(result.category_id).toBe(newCategoryResult[0].id);
  });

  it('should set category to null', async () => {
    const input: UpdateBlogPostInput = {
      id: postId,
      category_id: null
    };

    const result = await updateBlogPost(input, authorId);

    expect(result.category_id).toBeNull();
  });

  it('should update status from draft to published and set published_at', async () => {
    const input: UpdateBlogPostInput = {
      id: postId,
      status: 'published'
    };

    const result = await updateBlogPost(input, authorId);

    expect(result.status).toBe('published');
    expect(result.published_at).toBeInstanceOf(Date);
  });

  it('should update status from published to draft and clear published_at', async () => {
    // First publish the post
    await db.update(blogPostsTable)
      .set({ 
        status: 'published',
        published_at: new Date()
      })
      .where(eq(blogPostsTable.id, postId))
      .execute();

    const input: UpdateBlogPostInput = {
      id: postId,
      status: 'draft'
    };

    const result = await updateBlogPost(input, authorId);

    expect(result.status).toBe('draft');
    expect(result.published_at).toBeNull();
  });

  it('should update tag associations', async () => {
    // Create additional tag
    const tag3Result = await db.insert(tagsTable)
      .values({ name: 'Tag 3' })
      .returning()
      .execute();
    const tag3Id = tag3Result[0].id;

    const input: UpdateBlogPostInput = {
      id: postId,
      tag_ids: [tagIds[1], tag3Id] // Replace existing tags
    };

    await updateBlogPost(input, authorId);

    // Verify tag associations in database
    const postTags = await db.select()
      .from(postTagsTable)
      .where(eq(postTagsTable.post_id, postId))
      .execute();

    expect(postTags).toHaveLength(2);
    expect(postTags.map(pt => pt.tag_id).sort()).toEqual([tagIds[1], tag3Id].sort());
  });

  it('should clear all tag associations when empty array provided', async () => {
    const input: UpdateBlogPostInput = {
      id: postId,
      tag_ids: []
    };

    await updateBlogPost(input, authorId);

    // Verify no tag associations remain
    const postTags = await db.select()
      .from(postTagsTable)
      .where(eq(postTagsTable.post_id, postId))
      .execute();

    expect(postTags).toHaveLength(0);
  });

  it('should save updated post to database', async () => {
    const input: UpdateBlogPostInput = {
      id: postId,
      title: 'Database Test Title',
      content: 'Database test content'
    };

    await updateBlogPost(input, authorId);

    // Verify in database
    const posts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, postId))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('Database Test Title');
    expect(posts[0].content).toBe('Database test content');
    expect(posts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when post does not exist', async () => {
    const input: UpdateBlogPostInput = {
      id: 99999,
      title: 'Non-existent Post'
    };

    await expect(updateBlogPost(input, authorId))
      .rejects.toThrow(/not found or access denied/i);
  });

  it('should throw error when user does not own the post', async () => {
    const input: UpdateBlogPostInput = {
      id: postId,
      title: 'Unauthorized Update'
    };

    await expect(updateBlogPost(input, otherAuthorId))
      .rejects.toThrow(/not found or access denied/i);
  });

  it('should handle null excerpt', async () => {
    const input: UpdateBlogPostInput = {
      id: postId,
      excerpt: null
    };

    const result = await updateBlogPost(input, authorId);

    expect(result.excerpt).toBeNull();
  });
});
