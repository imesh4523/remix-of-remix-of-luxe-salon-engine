import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Star, Search, Filter, Eye, EyeOff, MessageSquare, Store,
  ChevronLeft, ChevronRight, AlertTriangle, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAllReviews, useHideReview, useRespondToReview } from '@/hooks/useAdminData';

const ITEMS_PER_PAGE = 10;

export const ReviewModeration = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [showHideDialog, setShowHideDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [hideReason, setHideReason] = useState('');
  const [adminResponse, setAdminResponse] = useState('');

  const { data: reviews, isLoading } = useAllReviews();
  const hideReview = useHideReview();
  const respondToReview = useRespondToReview();

  // Filter reviews
  const filteredReviews = reviews?.filter(review => {
    const matchesSearch = 
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.salon?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = ratingFilter === 'all' || review.rating === parseInt(ratingFilter);
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'visible' && !review.is_hidden) ||
      (statusFilter === 'hidden' && review.is_hidden);
    
    return matchesSearch && matchesRating && matchesStatus;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = filteredReviews.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handleHideReview = async () => {
    if (!selectedReview) return;
    
    try {
      await hideReview.mutateAsync({
        reviewId: selectedReview.id,
        isHidden: !selectedReview.is_hidden,
        reason: hideReason,
      });
      setShowHideDialog(false);
      setHideReason('');
      setSelectedReview(null);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleRespond = async () => {
    if (!selectedReview || !adminResponse.trim()) return;
    
    try {
      await respondToReview.mutateAsync({
        reviewId: selectedReview.id,
        response: adminResponse,
      });
      setShowResponseDialog(false);
      setAdminResponse('');
      setSelectedReview(null);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-warning fill-warning' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  // Stats
  const stats = {
    total: reviews?.length || 0,
    visible: reviews?.filter(r => !r.is_hidden).length || 0,
    hidden: reviews?.filter(r => r.is_hidden).length || 0,
    avgRating: reviews?.length 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
      : '0.0',
    lowRatings: reviews?.filter(r => r.rating <= 2).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">
            Review <span className="gradient-text">Moderation</span>
          </h1>
          <p className="text-muted-foreground mt-1">Monitor and moderate customer reviews</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Reviews', value: stats.total, icon: MessageSquare, color: 'text-foreground' },
          { label: 'Visible', value: stats.visible, icon: Eye, color: 'text-success' },
          { label: 'Hidden', value: stats.hidden, icon: EyeOff, color: 'text-muted-foreground' },
          { label: 'Avg Rating', value: stats.avgRating, icon: Star, color: 'text-warning' },
          { label: 'Low Ratings (≤2)', value: stats.lowRatings, icon: AlertTriangle, color: 'text-destructive' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glass-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="glass-card border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, salon, or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Star className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card className="glass-card border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : paginatedReviews.length > 0 ? (
            <>
              <div className="divide-y divide-border/50">
                {paginatedReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 sm:p-6 ${review.is_hidden ? 'bg-muted/20 opacity-60' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Customer Info */}
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.customer?.avatar_url || undefined} />
                          <AvatarFallback>
                            {review.customer?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-medium">
                              {review.customer?.full_name || 'Anonymous'}
                            </span>
                            {renderStars(review.rating)}
                            {review.is_hidden && (
                              <Badge className="bg-destructive/20 text-destructive">Hidden</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Store className="h-3 w-3" />
                            <span>{review.salon?.name || 'Unknown Salon'}</span>
                            <span>•</span>
                            <span>{format(new Date(review.created_at), 'MMM dd, yyyy')}</span>
                          </div>
                          
                          {review.comment ? (
                            <p className="text-sm">{review.comment}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No comment provided</p>
                          )}

                          {review.admin_response && (
                            <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <p className="text-xs font-medium text-primary mb-1">Admin Response:</p>
                              <p className="text-sm">{review.admin_response}</p>
                            </div>
                          )}

                          {review.is_hidden && review.hidden_reason && (
                            <div className="mt-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                              <p className="text-xs font-medium text-destructive mb-1">Hidden Reason:</p>
                              <p className="text-sm">{review.hidden_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col items-center gap-2 sm:ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className={review.is_hidden ? 'text-success' : 'text-destructive'}
                          onClick={() => {
                            setSelectedReview(review);
                            setShowHideDialog(true);
                          }}
                        >
                          {review.is_hidden ? (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Show
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Hide
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReview(review);
                            setAdminResponse(review.admin_response || '');
                            setShowResponseDialog(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {review.admin_response ? 'Edit' : 'Reply'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, filteredReviews.length)} of {filteredReviews.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages || 1}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No reviews found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hide/Show Review Dialog */}
      <Dialog open={showHideDialog} onOpenChange={setShowHideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedReview?.is_hidden ? 'Show Review' : 'Hide Review'}
            </DialogTitle>
            <DialogDescription>
              {selectedReview?.is_hidden 
                ? 'This will make the review visible to everyone again.'
                : 'Hidden reviews will not be shown to the public.'
              }
            </DialogDescription>
          </DialogHeader>
          {!selectedReview?.is_hidden && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason for hiding (optional)</Label>
                <Textarea
                  placeholder="e.g., Inappropriate language, spam, etc."
                  value={hideReason}
                  onChange={(e) => setHideReason(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHideDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedReview?.is_hidden ? 'default' : 'destructive'}
              onClick={handleHideReview}
              disabled={hideReview.isPending}
            >
              {hideReview.isPending 
                ? 'Processing...' 
                : selectedReview?.is_hidden ? 'Show Review' : 'Hide Review'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Respond to Review Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              Add an official response from the platform to this review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReview && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.rating)}
                  <span className="text-sm text-muted-foreground">
                    by {selectedReview.customer?.full_name || 'Anonymous'}
                  </span>
                </div>
                <p className="text-sm">{selectedReview.comment || 'No comment'}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Your Response</Label>
              <Textarea
                placeholder="Write your response..."
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRespond}
              disabled={!adminResponse.trim() || respondToReview.isPending}
            >
              {respondToReview.isPending ? 'Saving...' : 'Save Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
