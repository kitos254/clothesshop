import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Save, 
  ArrowLeft,
  FolderPlus,
  Folder
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import axios from '@/lib/axios';

// Simple category form schema - just name and parent
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  parent: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  _id: string;
  name: string;
  level: number;
  parent?: {
    _id: string;
    name: string;
  };
}

interface CategoryFormProps {
  mode: 'create' | 'edit';
}

const CategoryForm: React.FC<CategoryFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { admin } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableParents, setAvailableParents] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<any>(null);

  const canManageCategories = admin && ["super_admin", "admin", "manager"].includes(admin.role);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      parent: 'none',
    },
  });

  useEffect(() => {
    if (!canManageCategories) {
      navigate('/categories');
      return;
    }

    fetchAvailableParents();

    if (mode === 'edit' && id) {
      fetchCategory();
    }
  }, [mode, id, canManageCategories]);

  const fetchAvailableParents = async () => {
    try {
      // Fetch categories that can be parents (level 0 and 1 only for 3-level hierarchy)
      // Level 2 categories (grandchildren) cannot have children
      const response = await axios.get('/categories', {
        params: {
          isActive: true,
          limit: 100
        }
      });

      if (response.data.success) {
        let parents = response.data.data;
        
        // Filter out the current category and its descendants when editing
        if (mode === 'edit' && id) {
          parents = parents.filter((cat: Category) => cat._id !== id);
        }
        
        // Only show categories that can have children (level 0 and 1)
        // Level 2 categories are grandchildren and cannot have more children
        parents = parents.filter((cat: Category) => cat.level < 2);

        setAvailableParents(parents);
      }
    } catch (error) {
      console.error('Error fetching parent categories:', error);
    }
  };

  const fetchCategory = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await axios.get(`/categories/${id}`);

      if (response.data.success) {
        const category = response.data.data;
        setCurrentCategory(category);

        // Populate form with existing data
        form.reset({
          name: category.name,
          parent: category.parent?._id || 'none',
        });
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      toast({
        title: "Error",
        description: "Failed to load category data.",
        variant: "destructive",
      });
      navigate('/categories');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setSubmitting(true);

      // Handle parent value - convert "none" to empty string
      const submitData = {
        name: data.name,
        parent: data.parent === 'none' ? '' : data.parent
      };

      let response;
      if (mode === 'create') {
        response = await axios.post('/categories', submitData);
      } else {
        response = await axios.put(`/categories/${id}`, submitData);
      }

      if (response.data.success) {
        toast({
          title: "Success",
          description: `Category ${mode === 'create' ? 'created' : 'updated'} successfully.`,
        });
        navigate('/categories');
      }
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || `Failed to ${mode} category.`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-4 bg-muted rounded w-64" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const parentValue = form.watch('parent');
  const selectedParent = parentValue && parentValue !== 'none' ? availableParents.find(p => p._id === parentValue) : null;
  const currentLevel = selectedParent ? selectedParent.level + 1 : 0;
  const maxLevelReached = currentLevel >= 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/categories')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold mt-2 flex items-center gap-2">
            <FolderPlus className="h-8 w-8" />
            {mode === 'create' ? 'Create Category' : 'Edit Category'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'create' 
              ? 'Create a new category folder (max 3 levels)'
              : 'Update category name and location'
            }
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Category Information
            </CardTitle>
            <CardDescription>
              Simple category creation like creating folders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Electronics, Clothing, Books..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a clear, descriptive name for your category
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent category (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">📁 No Parent (Main Category - Level 1)</SelectItem>
                          {availableParents.map((parent) => (
                            <SelectItem 
                              key={parent._id} 
                              value={parent._id}
                            >
                              <div className="flex items-center space-x-2">
                                <span>{parent.level === 0 ? '📁' : '📂'} {parent.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {parent.level === 0 ? 'Parent' : 'Child'}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {selectedParent ? (
                          <div className="flex flex-col space-y-1">
                            <span>
                              📂 Will be placed inside "{selectedParent.name}" 
                              {currentLevel === 2 && (
                                <Badge variant="secondary" className="ml-2">Grandchild - Products go here</Badge>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Hierarchy: Parent → Child → Grandchild (products are placed in grandchild categories)
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-1">
                            <span>📁 This will be a main/parent category</span>
                            <span className="text-xs text-muted-foreground">
                              Hierarchy: Parent → Child → Grandchild (max 3 levels)
                            </span>
                          </div>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {submitting 
                      ? (mode === 'create' ? 'Creating...' : 'Saving...') 
                      : (mode === 'create' ? 'Create Category' : 'Save Changes')
                    }
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/categories')}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CategoryForm;
