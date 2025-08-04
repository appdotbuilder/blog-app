
import { db } from '../db';
import { 
  blogPostsTable, 
  usersTable, 
  categoriesTable, 
  tagsTable, 
  postTagsTable, 
  commentsTable 
} from '../db/schema';
import { type BlogPostWithRelations } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getBlogPostBySlug = async (slug: string): Promise<BlogPostWithRelations | null> => {
  try {
    // First, get the blog post with author and category
    const postResult = await db.select()
      .from(blogPostsTable)
      .innerJoin(usersTable, eq(blogPostsTable.author_id, usersTable.id))
      .leftJoin(categoriesTable, eq(blogPostsTable.category_id, categoriesTable.id))
      .where(
        and(
          eq(blogPostsTable.slug, slug),
          eq(blogPostsTable.status, 'published')
        )
      )
      .execute();

    if (postResult.length === 0) {
      return null;
    }

    const postData = postResult[0];

    // Get tags for the post
    const tagsResult = await db.select({
      id: tagsTable.id,
      name: tagsTable.name,
      created_at: tagsTable.created_at
    })
      .from(postTagsTable)
      .innerJoin(tagsTable, eq(postTagsTable.tag_id, tagsTable.id))
      .where(eq(postTagsTable.post_id, postData.blog_posts.id))
      .execute();

    // Get approved comments for the post
    const commentsResult = await db.select()
      .from(commentsTable)
      .where(
        and(
          eq(commentsTable.post_id, postData.blog_posts.id),
          eq(commentsTable.status, 'approved')
        )
      )
      .execute();

    // Construct the response with all relations
    return {
      id: postData.blog_posts.id,
      title: postData.blog_posts.title,
      slug: postData.blog_posts.slug,
      content: postData.blog_posts.content,
      excerpt: postData.blog_posts.excerpt,
      author_id: postData.blog_posts.author_id,
      category_id: postData.blog_posts.category_id,
      status: postData.blog_posts.status,
      published_at: postData.blog_posts.published_at,
      created_at: postData.blog_posts.created_at,
      updated_at: postData.blog_posts.updated_at,
      author: {
        id: postData.users.id,
        username: postData.users.username,
        email: postData.users.email,
        password_hash: postData.users.password_hash,
        role: postData.users.role,
        created_at: postData.users.created_at,
        updated_at: postData.users.updated_at
      },
      category: postData.categories ? {
        id: postData.categories.id,
        name: postData.categories.name,
        slug: postData.categories.slug,
        created_at: postData.categories.created_at
      } : null,
      tags: tagsResult,
      comments: commentsResult
    };
  } catch (error) {
    console.error('Failed to get blog post by slug:', error);
    throw error;
  }
};
