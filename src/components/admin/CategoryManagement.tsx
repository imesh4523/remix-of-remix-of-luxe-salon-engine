import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Edit2, Trash2, GripVertical, Check, X, Scissors, Sparkles,
  Heart, Eye, Zap, Star, Droplet, Flower2, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useServiceCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useAdminData';

const ICON_OPTIONS = [
  { value: 'scissors', label: 'Scissors', icon: Scissors },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'eye', label: 'Eye', icon: Eye },
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'droplet', label: 'Droplet', icon: Droplet },
  { value: 'flower', label: 'Flower', icon: Flower2 },
  { value: 'crown', label: 'Crown', icon: Crown },
];

const getIconComponent = (iconName: string | null) => {
  const found = ICON_OPTIONS.find(opt => opt.value === iconName);
  return found ? found.icon : Scissors;
};

export const CategoryManagement = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deleteCategory, setDeleteCategory] = useState<any>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('scissors');

  const { data: categories, isLoading } = useServiceCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const handleAdd = async () => {
    if (!formName.trim()) return;
    
    try {
      await createCategory.mutateAsync({
        name: formName,
        icon: formIcon,
      });
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleEdit = async () => {
    if (!editingCategory || !formName.trim()) return;
    
    try {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        name: formName,
        icon: formIcon,
      });
      setEditingCategory(null);
      resetForm();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;
    
    try {
      await deleteCategoryMutation.mutateAsync(deleteCategory.id);
      setDeleteCategory(null);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleToggleActive = async (category: any) => {
    try {
      await updateCategory.mutateAsync({
        id: category.id,
        is_active: !category.is_active,
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormIcon('scissors');
  };

  const openEditDialog = (category: any) => {
    setFormName(category.name);
    setFormIcon(category.icon || 'scissors');
    setEditingCategory(category);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">
            Service <span className="gradient-text">Categories</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage service categories for salons</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Categories</p>
            <p className="text-2xl font-bold">{categories?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-success">
              {categories?.filter(c => c.is_active !== false).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {categories?.filter(c => c.is_active === false).length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif">All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="space-y-3">
              {categories
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((category, index) => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-4 p-4 rounded-xl border border-border/50 transition-colors ${
                        category.is_active !== false ? 'bg-muted/30' : 'bg-muted/10 opacity-60'
                      }`}
                    >
                      <div className="cursor-move text-muted-foreground">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Order: {category.display_order || 0}
                        </p>
                      </div>
                      
                      <Badge className={category.is_active !== false ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>
                        {category.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                      
                      <Switch
                        checked={category.is_active !== false}
                        onCheckedChange={() => handleToggleActive(category)}
                      />
                      
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteCategory(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Scissors className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No categories found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowAddDialog(true)}
              >
                Add Your First Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new service category for salons.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g., Hair Care, Nail Art..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={formIcon} onValueChange={setFormIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!formName.trim() || createCategory.isPending}
            >
              {createCategory.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => { setEditingCategory(null); resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g., Hair Care, Nail Art..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={formIcon} onValueChange={setFormIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingCategory(null); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formName.trim() || updateCategory.isPending}
            >
              {updateCategory.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteCategory?.name}"? This action cannot be undone.
              Services using this category will become uncategorized.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategory(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
