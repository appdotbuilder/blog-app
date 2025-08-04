
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, blogPostsTable } from '../db/schema';
import { getAuthorPosts } from '../handlers/get_author_posts';

describe('getAuthorPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all posts by specific author', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'author1',
          email: 'author1@test.com',
          password_hash: 'hash1',
          role: 'author'
        },
        {
          username: 'author2',
          email: 'author2@test.com',
          password_hash: 'hash2',
          role: 'author'
        }
      ])
      .returning()
      .execute();

    const author1 = users[0];
    const author2 = users[1];

    // Create test posts for both authors
    await db.insert(blogPostsTable)
      .values([
        {
          title: 'Author 1 Post 1',
          slug: 'author-1-post-1',
          content: 'Content 1',
          excerpt: 'Excerpt 1',
          author_id: author1.id,
          status: 'published'
        },
        {
          title: 'Author 1 Post 2',
          slug: 'author-1-post-2',
          content: 'Content 2',
          excerpt: 'Excerpt 2',
          author_id: author1.id,
          status: 'draft'
        },
        {
          title: 'Author 2 Post 1',
          slug: 'author-2-post-1',
          content: 'Content 3',
          excerpt: 'Excerpt 3',
          author_id: author2.id,
          status: 'published'
        }
      ])
      .execute();

    const result = await getAuthorPosts(author1.id);

    // Should return only author1's posts
    expect(result).toHaveLength(2);
    expect(result.every(post => post.author_id === author1.id)).toBe(true);
    
    // Should include both published and draft posts
    const statuses = result.map(post => post.status);
    expect(statuses).toContain('published');
    expect(statuses).toContain('draft');
  });

  it('should return posts ordered by created_at descending', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'test@test.com',
        password_hash: 'hash',
        role: 'author'
      })
      .returning()
      .execute();

    const authorId = user[0].id;

    // Create posts with different timestamps
    const now = new Date();
    const olderDate = new Date(now.getTime() - 60000); // 1 minute ago
    const newerDate = new Date(now.getTime() + 60000); // 1 minute in future

    await db.insert(blogPostsTable)
      .values([
        {
          title: 'Older Post',
          slug: 'older-post',
          content: 'Older content',
          author_id: authorId,
          status: 'published',
          created_at: olderDate
        },
        {
          title: 'Newer Post',
          slug: 'newer-post',
          content: 'Newer content',
          author_id: authorId,
          status: 'published',
          created_at: newerDate
        }
      ])
      .execute();

    const result = await getAuthorPosts(authorId);

    expect(result).toHaveLength(2);
    // First post should be the newer one (descending order)
    expect(result[0].title).toBe('Newer Post');
    expect(result[1].title).toBe('Older Post');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should return empty array for author with no posts', async () => {
    // Create test user but no posts
    const user = await db.insert(usersTable)
      .values({
        username: 'nopostauthor',
        email: 'nopost@test.com',
        password_hash: 'hash',
        role: 'author'
      })
      .returning()
      .execute();

    const result = await getAuthorPosts(user[0].id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent author', async () => {
    const result = await getAuthorPosts(999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
