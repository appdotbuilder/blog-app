
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { BlogPostWithRelations } from '../../../server/src/schema';

interface BlogPostListProps {
  posts: BlogPostWithRelations[];
  onViewPost: (post: BlogPostWithRelations) => void;
}

export function BlogPostList({ posts, onViewPost }: BlogPostListProps) {
  return (
    <div className="space-y-6">
      {posts.map((post: BlogPostWithRelations) => (
        <Card key={post.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2 hover:text-blue-600 cursor-pointer">
                  {post.title}
                </CardTitle>
                <CardDescription className="text-base">
                  {post.excerpt || post.content.substring(0, 150) + '...'}
                </CardDescription>
              </div>
              <div className="ml-4">
                {post.category && (
                  <Badge variant="secondary">{post.category.name}</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {post.author.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{post.author.username}</p>
                    <p className="text-xs text-gray-500">
                      {post.published_at?.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        #{tag.name}
                      </Badge>
                    ))}
                    {post.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>💬 {post.comments.length} comments</span>
                  <span>👀 {Math.floor(Math.random() * 100) + 10} views</span>
                </div>
                <Button onClick={() => onViewPost(post)}>
                  Read More →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
