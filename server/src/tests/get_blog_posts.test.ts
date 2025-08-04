
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, tagsTable, blogPostsTable, postTagsTable, commentsTable } from '../db/schema';
import { getBlogPosts } from '../handlers/get_blog_posts';

describe('getBlogPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no published posts exist', async () => {
    const result = await getBlogPosts();
    expect(result).toEqual([]);
  });

  it('should return published blog posts with all relations', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Tech',
        slug: 'tech'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test tags
    const tagResult1 = await db.insert(tagsTable)
      .values({ name: 'JavaScript' })
      .returning()
      .execute();
    const tagResult2 = await db.insert(tagsTable)
      .values({ name: 'TypeScript' })
      .returning()
      .execute();

    // Create published blog post
    const postResult = await db.insert(blogPostsTable)
      .values({
        title: 'Test Blog Post',
        slug: 'test-blog-post',
        content: 'This is test content',
        excerpt: 'Test excerpt',
        author_id: userId,
        category_id: categoryId,
        status: 'published',
        published_at: new Date()
      })
      .returning()
      .execute();
    const postId = postResult[0].id;

    // Create draft post (should not be returned)
    await db.insert(blogPostsTable)
      .values({
        title: 'Draft Post',
        slug: 'draft-post',
        content: 'Draft content',
        author_id: userId,
        status: 'draft'
      })
      .execute();

    // Associate tags with the published post
    await db.insert(postTagsTable)
      .values([
        { post_id: postId, tag_id: tagResult1[0].id },
        { post_id: postId, tag_id: tagResult2[0].id }
      ])
      .execute();

    // Create comments for the published post
    await db.insert(commentsTable)
      .values([
        {
          content: 'Great post!',
          author_name: 'Reader One',
          author_email: 'reader1@test.com',
          post_id: postId,
          status: 'approved'
        },
        {
          content: 'Very informative',
          author_name: 'Reader Two',
          author_email: 'reader2@test.com',
          post_id: postId,
          status: 'pending'
        }
      ])
      .execute();

    const result = await getBlogPosts();

    expect(result).toHaveLength(1);

    const blogPost = result[0];
    
    // Verify blog post fields
    expect(blogPost.id).toBe(postId);
    expect(blogPost.title).toBe('Test Blog Post');
    expect(blogPost.slug).toBe('test-blog-post');
    expect(blogPost.content).toBe('This is test content');
    expect(blogPost.excerpt).toBe('Test excerpt');
    expect(blogPost.author_id).toBe(userId);
    expect(blogPost.category_id).toBe(categoryId);
    expect(blogPost.status).toBe('published');
    expect(blogPost.published_at).toBeInstanceOf(Date);
    expect(blogPost.created_at).toBeInstanceOf(Date);
    expect(blogPost.updated_at).toBeInstanceOf(Date);

    // Verify author relation
    expect(blogPost.author).toBeDefined();
    expect(blogPost.author.id).toBe(userId);
    expect(blogPost.author.username).toBe('testauthor');
    expect(blogPost.author.email).toBe('author@test.com');
    expect(blogPost.author.role).toBe('author');

    // Verify category relation
    expect(blogPost.category).toBeDefined();
    expect(blogPost.category!.id).toBe(categoryId);
    expect(blogPost.category!.name).toBe('Tech');
    expect(blogPost.category!.slug).toBe('tech');

    // Verify tags relation
    expect(blogPost.tags).toHaveLength(2);
    const tagNames = blogPost.tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['JavaScript', 'TypeScript']);
    blogPost.tags.forEach(tag => {
      expect(tag.id).toBeDefined();
      expect(tag.created_at).toBeInstanceOf(Date);
    });

    // Verify comments relation
    expect(blogPost.comments).toHaveLength(2);
    const commentContents = blogPost.comments.map(comment => comment.content).sort();
    expect(commentContents).toEqual(['Great post!', 'Very informative']);
    blogPost.comments.forEach(comment => {
      expect(comment.id).toBeDefined();
      expect(comment.post_id).toBe(postId);
      expect(comment.author_name).toBeDefined();
      expect(comment.author_email).toBeDefined();
      expect(comment.status).toMatch(/^(approved|pending|rejected)$/);
      expect(comment.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return blog post with null category when no category assigned', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create published blog post without category
    await db.insert(blogPostsTable)
      .values({
        title: 'No Category Post',
        slug: 'no-category-post',
        content: 'Content without category',
        author_id: userId,
        category_id: null,
        status: 'published',
        published_at: new Date()
      })
      .execute();

    const result = await getBlogPosts();

    expect(result).toHaveLength(1);
    expect(result[0].category).toBeNull();
    expect(result[0].tags).toEqual([]);
    expect(result[0].comments).toEqual([]);
  });

  it('should only return published posts, not drafts', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create one published and one draft post
    await db.insert(blogPostsTable)
      .values([
        {
          title: 'Published Post',
          slug: 'published-post',
          content: 'Published content',
          author_id: userId,
          status: 'published',
          published_at: new Date()
        },
        {
          title: 'Draft Post',
          slug: 'draft-post',
          content: 'Draft content',
          author_id: userId,
          status: 'draft'
        }
      ])
      .execute();

    const result = await getBlogPosts();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Published Post');
    expect(result[0].status).toBe('published');
  });
});
