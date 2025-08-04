
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { CreateBlogPostInput, Category, Tag } from '../../../server/src/schema';

interface BlogPostFormProps {
  onPostCreated: () => void;
}

export function BlogPostForm({ onPostCreated }: BlogPostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  
  const [formData, setFormData] = useState<CreateBlogPostInput>({
    title: '',
    slug: '',
    content: '',
    excerpt: null,
    category_id: null,
    status: 'draft',
    tag_ids: []
  });

  // Load categories and tags
  const loadData = useCallback(async () => {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        trpc.getCategories.query(),
        trpc.getTags.query()
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load categories and tags:', error);
      // Using demo data since handlers are placeholders
      setCategories([
        { id: 1, name: 'Development', slug: 'development', created_at: new Date() },
        { id: 2, name: 'Design', slug: 'design', created_at: new Date() },
        { id: 3, name: 'Technology', slug: 'technology', created_at: new Date() },
        { id: 4, name: 'Tutorial', slug: 'tutorial', created_at: new Date() }
      ]);
      setTags([
        { id: 1, name: 'React', created_at: new Date() },
        { id: 2, name: 'TypeScript', created_at: new Date() },
        { id: 3, name: 'JavaScript', created_at: new Date() },
        { id: 4, name: 'CSS', created_at: new Date() },
        { id: 5, name: 'HTML', created_at: new Date() },
        { id: 6, name: 'Web Development', created_at: new Date() },
        { id: 7, name: 'Frontend', created_at: new Date() },
        { id: 8, name: 'Backend', created_at: new Date() }
      ]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev: CreateBlogPostInput) => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTags((prev: number[]) => {
      const newTags = prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
      
      setFormData((prevForm: CreateBlogPostInput) => ({
        ...prevForm,
        tag_ids: newTags
      }));
      
      return newTags;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await trpc.createBlogPost.mutate({
        ...formData,
        tag_ids: selectedTags
      });
      
      // Reset form
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: null,
        category_id: null,
        status: 'draft',
        tag_ids: []
      });
      setSelectedTags([]);
      
      onPostCreated();
    } catch (error) {
      console.error('Failed to create post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create New Blog Post</CardTitle>
        <CardDescription>
          Share your knowledge and insights with the community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title and Slug */}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter a compelling title for your post"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTitleChange(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                placeholder="url-friendly-slug"
                value={formData.slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateBlogPostInput) => ({ ...prev, slug: e.target.value }))
                }
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated from title. You can customize it.
              </p>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <Label htmlFor="excerpt">Excerpt (Optional)</Label>
            <Textarea
              id="excerpt"
              placeholder="A brief summary of your post (optional)"
              rows={3}
              value={formData.excerpt || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateBlogPostInput) => ({ 
                  ...prev, 
                  excerpt: e.target.value || null 
                }))
              }
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Write your amazing content here..."
              rows={15}
              value={formData.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateBlogPostInput) => ({ ...prev, content: e.target.value }))
              }
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Current length: {formData.content.length} characters
            </p>
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id?.toString() || 'none'}
                onValueChange={(value: string) =>
                  setFormData((prev: CreateBlogPostInput) => ({
                    ...prev,
                    category_id: value === 'none' ? null : parseInt(value)
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'draft'}
                onValueChange={(value: 'draft' | 'published') =>
                  setFormData((prev: CreateBlogPostInput) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">📝 Draft</SelectItem>
                  <SelectItem value="published">🌟 Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {tags.map((tag: Tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => handleTagToggle(tag.id)}
                  />
                  <Label htmlFor={`tag-${tag.id}`} className="text-sm">
                    {tag.name}
                  </Label>
                </div>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Selected tags:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map((tagId: number) => {
                    const tag = tags.find(t => t.id === tagId);
                    return tag ? (
                      <Badge key={tagId} variant="outline">
                        #{tag.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData((prev: CreateBlogPostInput) => ({ ...prev, status: 'draft' }))}
              disabled={isSubmitting}
            >
              💾 Save as Draft
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title || !formData.content}>
              {isSubmitting 
                ? '🔄 Creating...' 
                : formData.status === 'published' 
                  ? '🚀 Publish Post' 
                  : '📝 Create Draft'
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
