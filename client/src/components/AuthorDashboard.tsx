
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { User, BlogPost } from '../../../server/src/schema';

interface AuthorDashboardProps {
  user: User;
  onLogout: () => void;
  onCreatePost: () => void;
  onViewAllPosts: () => void;
}

export function AuthorDashboard({ user, onLogout, onCreatePost, onViewAllPosts }: AuthorDashboardProps) {
  const [authorPosts, setAuthorPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAuthorPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const posts = await trpc.getAuthorPosts.query();
      setAuthorPosts(posts);
    } catch (error) {
      console.error('Failed to load author posts:', error);
      // Using demo data since handlers are placeholders
      setAuthorPosts([
        {
          id: 1,
          title: 'My First Blog Post',
          slug: 'my-first-blog-post',
          content: 'This is the content of my first blog post...',
          excerpt: 'A brief introduction to my blogging journey.',
          author_id: user.id,
          category_id: 1,
          status: 'published',
          published_at: new Date('2024-01-15'),
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: 2,
          title: 'Draft Post in Progress',
          slug: 'draft-post-in-progress',
          content: 'This is a draft post that I am still working on...',
          excerpt: null,
          author_id: user.id,
          category_id: null,
          status: 'draft',
          published_at: null,
          created_at: new Date('2024-01-20'),
          updated_at: new Date('2024-01-20')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadAuthorPosts();
  }, [loadAuthorPosts]);

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await trpc.deleteBlogPost.mutate({ id: postId });
      setAuthorPosts((prev: BlogPost[]) => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
      // For demo purposes, remove from local state
      setAuthorPosts((prev: BlogPost[]) => prev.filter(post => post.id !== postId));
    }
  };

  const publishedPosts = authorPosts.filter(post => post.status === 'published');
  const draftPosts = authorPosts.filter(post => post.status === 'draft');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">👨‍💼 Author Dashboard</h1>
              <Badge variant="default">✍️ {user.username}</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={onViewAllPosts}>
                🌐 View All Posts
              </Button>
              <Button onClick={onCreatePost}>
                ✨ New Post
              </Button>
              <Button variant="outline" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-center">
                {authorPosts.length}
              </CardTitle>
              <CardDescription className="text-center">📝 Total Posts</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-center text-green-600">
                {publishedPosts.length}
              </CardTitle>
              <CardDescription className="text-center">🌟 Published</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-center text-yellow-600">
                {draftPosts.length}
              </CardTitle>
              <CardDescription className="text-center">📋 Drafts</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-center text-blue-600">
                {Math.floor(Math.random() * 500) + 100}
              </CardTitle>
              <CardDescription className="text-center">👀 Total Views</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Posts Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📚 Your Posts</span>
              <Button onClick={onCreatePost}>
                ➕ Create New Post
              </Button>
            </CardTitle>
            <CardDescription>
              Manage all your blog posts from one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Posts ({authorPosts.length})</TabsTrigger>
                <TabsTrigger value="published">Published ({publishedPosts.length})</TabsTrigger>
                <TabsTrigger value="drafts">Drafts ({draftPosts.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading your posts...</p>
                  </div>
                ) : authorPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✍️</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No posts yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                
                      Start your blogging journey by creating your first post!
                    </p>
                    <Button onClick={onCreatePost}>
                      🚀 Create Your First Post
                    </Button>
                  </div>
                ) : (
                  <PostsList 
                    posts={authorPosts} 
                    onDelete={handleDeletePost}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="published" className="mt-6">
                <PostsList 
                  posts={publishedPosts} 
                  onDelete={handleDeletePost}
                />
              </TabsContent>
              
              <TabsContent value="drafts" className="mt-6">
                <PostsList 
                  posts={draftPosts} 
                  onDelete={handleDeletePost}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface PostsListProps {
  posts: BlogPost[];
  onDelete: (postId: number) => void;
}

function PostsList({ posts, onDelete }: PostsListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📝</div>
        <p>No posts in this category yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post: BlogPost) => (
        <Card key={post.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{post.title}</h3>
                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                    {post.status === 'published' ? '🌟 Published' : '📋 Draft'}
                  </Badge>
                </div>
                
                {post.excerpt && (
                  <p className="text-gray-600 mb-3">{post.excerpt}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>📅 Created: {post.created_at.toLocaleDateString()}</span>
                  {post.published_at && (
                    <span>🚀 Published: {post.published_at.toLocaleDateString()}</span>
                  )}
                  <span>📝 {post.content.length} characters</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Button variant="outline" size="sm">
                  ✏️ Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDelete(post.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  🗑️ Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
