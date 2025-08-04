
import { db } from '../db';
import { blogPostsTable, usersTable, categoriesTable, tagsTable, postTagsTable, commentsTable } from '../db/schema';
import { type BlogPostWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export const getBlogPosts = async (): Promise<BlogPostWithRelations[]> => {
  try {
    // Get all published blog posts with their basic relations
    const postsWithBasicRelations = await db.select()
      .from(blogPostsTable)
      .leftJoin(usersTable, eq(blogPostsTable.author_id, usersTable.id))
      .leftJoin(categoriesTable, eq(blogPostsTable.category_id, categoriesTable.id))
      .where(eq(blogPostsTable.status, 'published'))
      .execute();

    // Get all tags for all posts in one query
    const postTags = await db.select({
      post_id: postTagsTable.post_id,
      tag_id: tagsTable.id,
      tag_name: tagsTable.name,
      tag_created_at: tagsTable.created_at
    })
      .from(postTagsTable)
      .innerJoin(tagsTable, eq(postTagsTable.tag_id, tagsTable.id))
      .execute();

    // Get all comments for all posts in one query
    const postComments = await db.select()
      .from(commentsTable)
      .execute();

    // Build the complete blog posts with relations
    return postsWithBasicRelations.map(result => {
      const post = result.blog_posts;
      const author = result.users;
      const category = result.categories;

      // Find tags for this specific post
      const tags = postTags
        .filter(pt => pt.post_id === post.id)
        .map(pt => ({
          id: pt.tag_id,
          name: pt.tag_name,
          created_at: pt.tag_created_at
        }));

      // Find comments for this specific post
      const comments = postComments
        .filter(comment => comment.post_id === post.id);

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        author_id: post.author_id,
        category_id: post.category_id,
        status: post.status,
        published_at: post.published_at,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: author!,
        category: category,
        tags,
        comments
      };
    });
  } catch (error) {
    console.error('Failed to get blog posts:', error);
    throw error;
  }
};
