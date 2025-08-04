
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  registerInputSchema,
  loginInputSchema,
  createCategoryInputSchema,
  createTagInputSchema,
  createBlogPostInputSchema,
  updateBlogPostInputSchema,
  createCommentInputSchema,
  updateCommentStatusInputSchema
} from './schema';

// Import handlers
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { createTag } from './handlers/create_tag';
import { getTags } from './handlers/get_tags';
import { createBlogPost } from './handlers/create_blog_post';
import { updateBlogPost } from './handlers/update_blog_post';
import { getBlogPosts } from './handlers/get_blog_posts';
import { getBlogPostBySlug } from './handlers/get_blog_post_by_slug';
import { getAuthorPosts } from './handlers/get_author_posts';
import { deleteBlogPost } from './handlers/delete_blog_post';
import { createComment } from './handlers/create_comment';
import { updateCommentStatus } from './handlers/update_comment_status';
import { getPostComments } from './handlers/get_post_comments';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  register: publicProcedure
    .input(registerInputSchema)
    .mutation(({ input }) => registerUser(input)),

  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Category routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  getCategories: publicProcedure
    .query(() => getCategories()),

  // Tag routes
  createTag: publicProcedure
    .input(createTagInputSchema)
    .mutation(({ input }) => createTag(input)),

  getTags: publicProcedure
    .query(() => getTags()),

  // Blog post routes
  createBlogPost: publicProcedure
    .input(createBlogPostInputSchema)
    .mutation(({ input }) => createBlogPost(input, 1)), // TODO: Get authorId from context

  updateBlogPost: publicProcedure
    .input(updateBlogPostInputSchema)
    .mutation(({ input }) => updateBlogPost(input, 1)), // TODO: Get authorId from context

  getBlogPosts: publicProcedure
    .query(() => getBlogPosts()),

  getBlogPostBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getBlogPostBySlug(input.slug)),

  getAuthorPosts: publicProcedure
    .query(() => getAuthorPosts(1)), // TODO: Get authorId from context

  deleteBlogPost: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteBlogPost(input.id, 1)), // TODO: Get authorId from context

  // Comment routes
  createComment: publicProcedure
    .input(createCommentInputSchema)
    .mutation(({ input }) => createComment(input)),

  updateCommentStatus: publicProcedure
    .input(updateCommentStatusInputSchema)
    .mutation(({ input }) => updateCommentStatus(input)),

  getPostComments: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(({ input }) => getPostComments(input.postId))
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
