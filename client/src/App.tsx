
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuthForm } from '@/components/AuthForm';
import { BlogPostForm } from '@/components/BlogPostForm';
import { BlogPostList } from '@/components/BlogPostList';
import { PostDetailView } from '@/components/PostDetailView';
import { AuthorDashboard } from '@/components/AuthorDashboard';
import type { User, BlogPostWithRelations } from '../../server/src/schema';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'post-detail' | 'author-dashboard' | 'create-post'>('home');
  const [selectedPost, setSelectedPost] = useState<BlogPostWithRelations | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPostWithRelations[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load blog posts
  const loadBlogPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const posts = await trpc.getBlogPosts.query();
      setBlogPosts(posts);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
      // Using stub data since handlers are placeholders
      setBlogPosts([
        {
          id: 1,
          title: 'Getting Started with React and TypeScript',
          slug: 'getting-started-react-typescript',
          content: 'React with TypeScript provides excellent developer experience with type safety...',
          excerpt: 'Learn how to set up a React project with TypeScript and best practices.',
          author_id: 1,
          category_id: 1,
          status: 'published' as const,
          published_at: new Date('2024-01-15'),
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15'),
          author: {
            id: 1,
            username: 'john_dev',
            email: 'john@example.com',
            password_hash: 'hash',
            role: 'author' as const,
            created_at: new Date(),
            updated_at: new Date()
          },
          category: {
            id: 1,
            name: 'Development',
            slug: 'development',
            created_at: new Date()
          },
          tags: [
            { id: 1, name: 'React', created_at: new Date() },
            { id: 2, name: 'TypeScript', created_at: new Date() }
          ],
          comments: [
            {
              id: 1,
              content: 'Great tutorial! Very helpful for beginners.',
              author_name: 'Alice',
              author_email: 'alice@example.com',
              post_id: 1,
              status: 'approved' as const,
              created_at: new Date('2024-01-16')
            }
          ]
        },
        {
          id: 2,
          title: 'Modern CSS Techniques',
          slug: 'modern-css-techniques',
          content: 'CSS has evolved tremendously with Grid, Flexbox, and custom properties...',
          excerpt: 'Explore the latest CSS features that make styling easier and more powerful.',
          author_id: 2,
          category_id: 2,
          status: 'published' as const,
          published_at: new Date('2024-01-10'),
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10'),
          author: {
            id: 2,
            username: 'sarah_designer',
            email: 'sarah@example.com',
            password_hash: 'hash',
            role: 'author' as const,
            created_at: new Date(),
            updated_at: new Date()
          },
          category: {
            id: 2,
            name: 'Design',
            slug: 'design',
            created_at: new Date()
          },
          tags: [
            { id: 3, name: 'CSS', created_at: new Date() },
            { id: 4, name: 'Design', created_at: new Date() }
          ],
          comments: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogPosts();
  }, [loadBlogPosts]);

  const handleLogin = async (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
  };

  const handlePostCreated = () => {
    loadBlogPosts();
    setCurrentView('author-dashboard');
  };

  const handleViewPost = (post: BlogPostWithRelations) => {
    setSelectedPost(post);
    setCurrentView('post-detail');
  };

  const filteredPosts = blogPosts.filter(post =>
    post.status === 'published' &&
    (post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     post.author.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (currentView === 'post-detail' && selectedPost) {
    return (
      <PostDetailView
        post={selectedPost}
        onBack={() => setCurrentView('home')}
        user={user}
      />
    );
  }

  if (currentView === 'author-dashboard' && user?.role === 'author') {
    return (
      <AuthorDashboard
        user={user}
        onLogout={handleLogout}
        onCreatePost={() => setCurrentView('create-post')}
        onViewAllPosts={() => setCurrentView('home')}
      />
    );
  }

  if (currentView === 'create-post' && user?.role === 'author') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">✍️ Create New Post</h1>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentView('author-dashboard')}
              >
                ← Back to Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
          <BlogPostForm 
            onPostCreated={handlePostCreated}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">📝 BlogSpace</h1>
              <Badge variant="secondary">Modern Blogging Platform</Badge>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    👋 Welcome, {user.username}
                  </span>
                  <Badge variant={user.role === 'author' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                  {user.role === 'author' && (
                    <Button onClick={() => setCurrentView('author-dashboard')}>
                      📊 Dashboard
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="text-gray-600">
                  👤 Guest Mode
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {!user ? (
          <div className="max-w-md mx-auto mt-16">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">🔐 Welcome to BlogSpace</CardTitle>
                <CardDescription>
                  Sign in to start reading and writing amazing content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuthForm onLogin={handleLogin} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Search and Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔍 Discover Amazing Content
                </CardTitle>
                <CardDescription>
                  Search through our collection of {blogPosts.length} published articles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    placeholder="Search articles by title, content, or author..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline">
                    📊 Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Main Content */}
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Blog Posts */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>📚 Latest Articles</span>
                      <Badge variant="outline">
                        {filteredPosts.length} posts
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading amazing content...</p>
                      </div>
                    ) : filteredPosts.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📖</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          No articles found
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {searchTerm 
                            ? `No articles match "${searchTerm}". Try a different search term.`
                            : 'No published articles yet. Check back soon!'
                          }
                        </p>
                        {searchTerm && (
                          <Button onClick={() => setSearchTerm('')} variant="outline">
                            Clear Search
                          </Button>
                        )}
                      </div>
                    ) : (
                      <BlogPostList 
                        posts={filteredPosts} 
                        onViewPost={handleViewPost}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* User Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">👤 Your Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <Badge variant={user.role === 'author' ? 'default' : 'secondary'}>
                      {user.role === 'author' ? '✍️ Author' : '📖 Reader'}
                    </Badge>
                    {user.role === 'author' && (
                      <Button 
                        className="w-full" 
                        onClick={() => setCurrentView('create-post')}
                      >
                        ✨ Write New Article
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Popular Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🏷️ Popular Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Development</Badge>
                      <Badge variant="outline">Design</Badge>
                      <Badge variant="outline">Technology</Badge>
                      <Badge variant="outline">Tutorials</Badge>
                      <Badge variant="outline">Best Practices</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📊 Community Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Articles</span>
                      <Badge variant="secondary">{blogPosts.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Published</span>
                      <Badge variant="secondary">
                        {blogPosts.filter(p => p.status === 'published').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Authors</span>
                      <Badge variant="secondary">
                        {new Set(blogPosts.map(p => p.author_id)).size}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
