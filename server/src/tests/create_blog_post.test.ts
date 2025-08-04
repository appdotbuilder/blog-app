
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, tagsTable, blogPostsTable, postTagsTable } from '../db/schema';
import { type CreateBlogPostInput } from '../schema';
import { createBlogPost } from '../handlers/create_blog_post';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  username: 'testauthor',
  email: 'author@test.com',
  password_hash: 'hashedpassword',
  role: 'author' as const
};

const testCategory = {
  name: 'Technology',
  slug: 'technology'
};

const testTag1 = {
  name: 'JavaScript'
};

const testTag2 = {
  name: 'Node.js'
};

const testInput: CreateBlogPostInput = {
  title: 'Test Blog Post',
  slug: 'test-blog-post',
  content: 'This is the content of the test blog post.',
  excerpt: 'This is a test excerpt.',
  category_id: null,
  status: 'draft',
  tag_ids: []
};

describe('createBlogPost', () => {
  let authorId: number;
  let categoryId: number;
  let tagId1: number;
  let tagId2: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test author
    const authorResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    authorId = authorResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create test tags
    const tag1Result = await db.insert(tagsTable)
      .values(testTag1)
      .returning()
      .execute();
    tagId1 = tag1Result[0].id;

    const tag2Result = await db.insert(tagsTable)
      .values(testTag2)
      .returning()
      .execute();
    tagId2 = tag2Result[0].id;
  });

  afterEach(resetDB);

  it('should create a blog post with all fields', async () => {
    const result = await createBlogPost(testInput, authorId);

    expect(result.title).toEqual('Test Blog Post');
    expect(result.slug).toEqual('test-blog-post');
    expect(result.content).toEqual(testInput.content);
    expect(result.excerpt).toEqual('This is a test excerpt.');
    expect(result.author_id).toEqual(authorId);
    expect(result.category_id).toBeNull();
    expect(result.status).toEqual('draft');
    expect(result.published_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save blog post to database', async () => {
    const result = await createBlogPost(testInput, authorId);

    const posts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, result.id))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toEqual('Test Blog Post');
    expect(posts[0].author_id).toEqual(authorId);
    expect(posts[0].status).toEqual('draft');
  });

  it('should create blog post with category', async () => {
    const inputWithCategory: CreateBlogPostInput = {
      ...testInput,
      category_id: categoryId
    };

    const result = await createBlogPost(inputWithCategory, authorId);

    expect(result.category_id).toEqual(categoryId);

    const posts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, result.id))
      .execute();

    expect(posts[0].category_id).toEqual(categoryId);
  });

  it('should create blog post with tags', async () => {
    const inputWithTags: CreateBlogPostInput = {
      ...testInput,
      tag_ids: [tagId1, tagId2]
    };

    const result = await createBlogPost(inputWithTags, authorId);

    // Check that post-tag associations were created
    const postTags = await db.select()
      .from(postTagsTable)
      .where(eq(postTagsTable.post_id, result.id))
      .execute();

    expect(postTags).toHaveLength(2);
    expect(postTags.map(pt => pt.tag_id).sort()).toEqual([tagId1, tagId2].sort());
  });

  it('should set published_at when status is published', async () => {
    const publishedInput: CreateBlogPostInput = {
      ...testInput,
      status: 'published'
    };

    const result = await createBlogPost(publishedInput, authorId);

    expect(result.status).toEqual('published');
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at).not.toBeNull();
  });

  it('should throw error if author does not exist', async () => {
    const nonExistentAuthorId = 99999;

    await expect(createBlogPost(testInput, nonExistentAuthorId)).rejects.toThrow(/author not found/i);
  });

  it('should throw error if category does not exist', async () => {
    const inputWithInvalidCategory: CreateBlogPostInput = {
      ...testInput,
      category_id: 99999
    };

    await expect(createBlogPost(inputWithInvalidCategory, authorId)).rejects.toThrow(/category not found/i);
  });

  it('should throw error if tag does not exist', async () => {
    const inputWithInvalidTag: CreateBlogPostInput = {
      ...testInput,
      tag_ids: [99999]
    };

    await expect(createBlogPost(inputWithInvalidTag, authorId)).rejects.toThrow(/one or more tags not found/i);
  });

  it('should create blog post with null excerpt', async () => {
    const inputWithNullExcerpt: CreateBlogPostInput = {
      ...testInput,
      excerpt: null
    };

    const result = await createBlogPost(inputWithNullExcerpt, authorId);

    expect(result.excerpt).toBeNull();
  });
});
