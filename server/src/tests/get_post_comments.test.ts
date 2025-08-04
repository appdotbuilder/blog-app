
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, blogPostsTable, commentsTable } from '../db/schema';
import { getPostComments } from '../handlers/get_post_comments';
import { eq } from 'drizzle-orm';

describe('getPostComments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return approved comments for a post', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();

    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category'
      })
      .returning()
      .execute();

    // Create test blog post
    const [post] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        author_id: user.id,
        category_id: category.id,
        status: 'published'
      })
      .returning()
      .execute();

    // Create approved comments
    const approvedComments = await db.insert(commentsTable)
      .values([
        {
          content: 'First approved comment',
          author_name: 'John Doe',
          author_email: 'john@test.com',
          post_id: post.id,
          status: 'approved'
        },
        {
          content: 'Second approved comment',
          author_name: 'Jane Smith',
          author_email: 'jane@test.com',
          post_id: post.id,
          status: 'approved'
        }
      ])
      .returning()
      .execute();

    // Create pending and rejected comments (should not be returned)
    await db.insert(commentsTable)
      .values([
        {
          content: 'Pending comment',
          author_name: 'Bob Wilson',
          author_email: 'bob@test.com',
          post_id: post.id,
          status: 'pending'
        },
        {
          content: 'Rejected comment',
          author_name: 'Alice Brown',
          author_email: 'alice@test.com',
          post_id: post.id,
          status: 'rejected'
        }
      ])
      .returning()
      .execute();

    const result = await getPostComments(post.id);

    expect(result).toHaveLength(2);
    expect(result[0].content).toEqual('First approved comment');
    expect(result[0].author_name).toEqual('John Doe');
    expect(result[0].author_email).toEqual('john@test.com');
    expect(result[0].post_id).toEqual(post.id);
    expect(result[0].status).toEqual('approved');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();

    expect(result[1].content).toEqual('Second approved comment');
    expect(result[1].author_name).toEqual('Jane Smith');
    expect(result[1].status).toEqual('approved');
  });

  it('should return empty array when post has no approved comments', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();

    // Create test blog post
    const [post] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        author_id: user.id,
        status: 'published'
      })
      .returning()
      .execute();

    // Create only pending comments
    await db.insert(commentsTable)
      .values({
        content: 'Pending comment',
        author_name: 'Bob Wilson',
        author_email: 'bob@test.com',
        post_id: post.id,
        status: 'pending'
      })
      .returning()
      .execute();

    const result = await getPostComments(post.id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent post', async () => {
    const result = await getPostComments(999);

    expect(result).toHaveLength(0);
  });

  it('should not return comments from other posts', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();

    // Create two test blog posts
    const [post1] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post 1',
        slug: 'test-post-1',
        content: 'Test content 1',
        author_id: user.id,
        status: 'published'
      })
      .returning()
      .execute();

    const [post2] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post 2',
        slug: 'test-post-2',
        content: 'Test content 2',
        author_id: user.id,
        status: 'published'
      })
      .returning()
      .execute();

    // Create comments for both posts
    await db.insert(commentsTable)
      .values([
        {
          content: 'Comment for post 1',
          author_name: 'John Doe',
          author_email: 'john@test.com',
          post_id: post1.id,
          status: 'approved'
        },
        {
          content: 'Comment for post 2',
          author_name: 'Jane Smith',
          author_email: 'jane@test.com',
          post_id: post2.id,
          status: 'approved'
        }
      ])
      .returning()
      .execute();

    const result = await getPostComments(post1.id);

    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('Comment for post 1');
    expect(result[0].post_id).toEqual(post1.id);
  });

  it('should verify comments are saved to database correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashedpassword',
        role: 'author'
      })
      .returning()
      .execute();

    // Create test blog post
    const [post] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        author_id: user.id,
        status: 'published'
      })
      .returning()
      .execute();

    // Create approved comment
    const [comment] = await db.insert(commentsTable)
      .values({
        content: 'Test approved comment',
        author_name: 'Test Author',
        author_email: 'test@test.com',
        post_id: post.id,
        status: 'approved'
      })
      .returning()
      .execute();

    // Query directly from database to verify
    const dbComments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, comment.id))
      .execute();

    expect(dbComments).toHaveLength(1);
    expect(dbComments[0].content).toEqual('Test approved comment');
    expect(dbComments[0].status).toEqual('approved');
    expect(dbComments[0].post_id).toEqual(post.id);

    // Test handler returns the same data
    const result = await getPostComments(post.id);
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(comment.id);
    expect(result[0].content).toEqual('Test approved comment');
  });
});
