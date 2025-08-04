
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  categoriesTable, 
  tagsTable, 
  blogPostsTable, 
  postTagsTable, 
  commentsTable 
} from '../db/schema';
import { getBlogPostBySlug } from '../handlers/get_blog_post_by_slug';

describe('getBlogPostBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent slug', async () => {
    const result = await getBlogPostBySlug('non-existent-slug');
    expect(result).toBeNull();
  });

  it('should return null for draft post', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();

    // Create draft post
    await db.insert(blogPostsTable)
      .values({
        title: 'Draft Post',
        slug: 'draft-post',
        content: 'This is a draft post',
        excerpt: 'Draft excerpt',
        author_id: userResult[0].id,
        status: 'draft'
      })
      .execute();

    const result = await getBlogPostBySlug('draft-post');
    expect(result).toBeNull();
  });

  it('should return published post with all relations', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();

    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Technology',
        slug: 'technology'
      })
      .returning()
      .execute();

    // Create tags
    const tag1Result = await db.insert(tagsTable)
      .values({ name: 'JavaScript' })
      .returning()
      .execute();

    const tag2Result = await db.insert(tagsTable)
      .values({ name: 'Web Dev' })
      .returning()
      .execute();

    // Create published post
    const postResult = await db.insert(blogPostsTable)
      .values({
        title: 'Test Blog Post',
        slug: 'test-blog-post',
        content: 'This is the content of the test blog post.',
        excerpt: 'Test excerpt',
        author_id: userResult[0].id,
        category_id: categoryResult[0].id,
        status: 'published',
        published_at: new Date()
      })
      .returning()
      .execute();

    // Link tags to post
    await db.insert(postTagsTable)
      .values([
        { post_id: postResult[0].id, tag_id: tag1Result[0].id },
        { post_id: postResult[0].id, tag_id: tag2Result[0].id }
      ])
      .execute();

    // Create approved comment
    await db.insert(commentsTable)
      .values({
        content: 'Great post!',
        author_name: 'Reader',
        author_email: 'reader@test.com',
        post_id: postResult[0].id,
        status: 'approved'
      })
      .execute();

    // Create pending comment (should not be included)
    await db.insert(commentsTable)
      .values({
        content: 'Pending comment',
        author_name: 'Another Reader',
        author_email: 'reader2@test.com',
        post_id: postResult[0].id,
        status: 'pending'
      })
      .execute();

    const result = await getBlogPostBySlug('test-blog-post');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(postResult[0].id);
    expect(result!.title).toEqual('Test Blog Post');
    expect(result!.slug).toEqual('test-blog-post');
    expect(result!.content).toEqual('This is the content of the test blog post.');
    expect(result!.excerpt).toEqual('Test excerpt');
    expect(result!.status).toEqual('published');
    expect(result!.published_at).toBeInstanceOf(Date);

    // Check author relation
    expect(result!.author.id).toEqual(userResult[0].id);
    expect(result!.author.username).toEqual('testauthor');
    expect(result!.author.email).toEqual('author@test.com');
    expect(result!.author.role).toEqual('author');

    // Check category relation
    expect(result!.category).not.toBeNull();
    expect(result!.category!.id).toEqual(categoryResult[0].id);
    expect(result!.category!.name).toEqual('Technology');
    expect(result!.category!.slug).toEqual('technology');

    // Check tags relation
    expect(result!.tags).toHaveLength(2);
    const tagNames = result!.tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['JavaScript', 'Web Dev']);

    // Check comments relation (only approved)
    expect(result!.comments).toHaveLength(1);
    expect(result!.comments[0].content).toEqual('Great post!');
    expect(result!.comments[0].author_name).toEqual('Reader');
    expect(result!.comments[0].status).toEqual('approved');
  });

  it('should return post without category when category_id is null', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();

    // Create published post without category
    await db.insert(blogPostsTable)
      .values({
        title: 'Uncategorized Post',
        slug: 'uncategorized-post',
        content: 'This post has no category.',
        excerpt: null,
        author_id: userResult[0].id,
        category_id: null,
        status: 'published',
        published_at: new Date()
      })
      .execute();

    const result = await getBlogPostBySlug('uncategorized-post');

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Uncategorized Post');
    expect(result!.category).toBeNull();
    expect(result!.excerpt).toBeNull();
    expect(result!.tags).toHaveLength(0);
    expect(result!.comments).toHaveLength(0);
  });
});
