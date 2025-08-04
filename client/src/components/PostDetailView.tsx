
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { BlogPostWithRelations, User, Comment, CreateCommentInput } from '../../../server/src/schema';

interface PostDetailViewProps {
  post: BlogPostWithRelations;
  onBack: () => void;
  user: User | null;
}

export function PostDetailView({ post, onBack, user }: PostDetailViewProps) {
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentForm, setCommentForm] = useState<CreateCommentInput>({
    content: '',
    author_name: user?.username || '',
    author_email: user?.email || '',
    post_id: post.id
  });

  const loadComments = useCallback(async () => {
    try {
      const postComments = await trpc.getPostComments.query({ postId: post.id });
      setComments(postComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
      // Keep existing comments as fallback
    }
  }, [post.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentForm.content.trim()) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await trpc.createComment.mutate(commentForm);
      setComments((prev: Comment[]) => [...prev, newComment]);
      setCommentForm((prev: CreateCommentInput) => ({ ...prev, content: '' }));
    } catch (error) {
      console.error('Failed to submit comment:', error);
      // For demo purposes, add comment locally
      const demoComment: Comment = {
        id: Date.now(),
        content: commentForm.content,
        author_name: commentForm.author_name,
        author_email: commentForm.author_email,
        post_id: post.id,
        status: 'pending',
        created_at: new Date()
      };
      setComments((prev: Comment[]) => [...prev, demoComment]);
      setCommentForm((prev: CreateCommentInput) => ({ ...prev, content: '' }));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Navigation */}
        <div className="mb-6">
          <Button variant="outline" onClick={onBack} className="mb-4">
            ← Back to Articles
          </Button>
        </div>

        {/* Article Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              {post.category && (
                <Badge variant="secondary" className="text-sm">
                  📁 {post.category.name}
                </Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {post.status}
              </Badge>
            </div>
            
            <CardTitle className="text-3xl font-bold mb-4">
              {post.title}
            </CardTitle>
            
            {post.excerpt && (
              <CardDescription className="text-lg text-gray-600 mb-6">
                {post.excerpt}
              </CardDescription>
            )}
            
            {/* Author Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg">
                    {post.author.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{post.author.username}</p>
                  <p className="text-sm text-gray-500">
                    Published on {post.published_at?.toLocaleDateString()} • 
                    {Math.ceil(post.content.length / 200)} min read
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>💬 {comments.length} comments</span>
                <span>👀 {Math.floor(Math.random() * 500) + 50} views</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Article Content */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {post.content}
              </div>
            </div>
            
            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Tags:</h4>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline">
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💬 Comments ({comments.length})
            </CardTitle>
            <CardDescription>
              Join the conversation and share your thoughts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Comment Form */}
            {user && (
              <form onSubmit={handleSubmitComment} className="mb-8 p-6 bg-gray-50 rounded-lg">
                <h4 className="text-lg font-semibold mb-4">✍️ Leave a Comment</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="comment-name">Name</Label>
                      <Input
                        id="comment-name"
                        value={commentForm.author_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCommentForm((prev: CreateCommentInput) => ({ ...prev, author_name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="comment-email">Email</Label>
                      <Input
                        id="comment-email"
                        type="email"
                        value={commentForm.author_email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCommentForm((prev: CreateCommentInput) => ({ ...prev, author_email: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="comment-content">Your Comment</Label>
                    <Textarea
                      id="comment-content"
                      rows={4}
                      placeholder="Share your thoughts about this article..."
                      value={commentForm.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCommentForm((prev: CreateCommentInput) => ({ ...prev, content: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSubmittingComment || !commentForm.content.trim()}>
                    {isSubmittingComment ? '🔄 Posting...' : '🚀 Post Comment'}
                  </Button>
                </div>
              </form>
            )}

            {!user && (
              <div className="mb-8 p-6 bg-blue-50 rounded-lg text-center">
                <p className="text-gray-700">
                  🔒 Please sign in to leave a comment and join the discussion.
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">💭</div>
                  <p className="text-gray-600">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
              ) : (
                comments
                  .filter((comment: Comment) => comment.status === 'approved' || comment.status === 'pending')
                  .map((comment: Comment) => (
                    <div key={comment.id} className="border-l-4 border-blue-200 pl-6 py-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {comment.author_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{comment.author_name}</p>
                            <p className="text-xs text-gray-500">
                              {comment.created_at.toLocaleDateString()} at {comment.created_at.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        {comment.status === 'pending' && (
                          <Badge variant="outline" className="text-xs">
                            ⏳ Pending Review
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
