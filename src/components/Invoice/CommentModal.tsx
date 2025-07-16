import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { InvoiceComment } from '../../types/invoice';
import { MessageSquare, Send, Clock, CheckCircle } from 'lucide-react';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitComment: (comment: string, type: 'question' | 'clarification' | 'correction') => void;
  existingComments: InvoiceComment[];
  isSubmitting?: boolean;
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  onSubmitComment,
  existingComments,
  isSubmitting = false
}) => {
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState<'question' | 'clarification' | 'correction'>('question');

  const handleSubmit = () => {
    if (commentText.trim()) {
      onSubmitComment(commentText.trim(), commentType);
      setCommentText('');
      setCommentType('question');
    }
  };

  const handleClose = () => {
    setCommentText('');
    setCommentType('question');
    onClose();
  };

  const getCommentTypeLabel = (type: string) => {
    switch (type) {
      case 'question': return 'Question';
      case 'clarification': return 'Clarification';
      case 'correction': return 'Correction';
      default: return type;
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'question': return 'bg-blue-100 text-blue-800';
      case 'clarification': return 'bg-yellow-100 text-yellow-800';
      case 'correction': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Comments for PMO Review</span>
          </DialogTitle>
          <DialogDescription>
            Add comments about issues or questions regarding this invoice. 
            PMO will be notified and invoice generation will be blocked until resolved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Comments */}
          {existingComments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">Existing Comments</h4>
                <Badge variant="outline">
                  {existingComments.length} comment{existingComments.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {existingComments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-3 bg-muted/20">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <Badge className={`text-xs ${getCommentTypeColor(comment.type)}`}>
                          {getCommentTypeLabel(comment.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        {comment.status === 'pending' ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                        <span>{new Date(comment.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Comment */}
          <div className="space-y-4">
            <h4 className="font-medium">Add New Comment</h4>
            
            <div className="space-y-2">
              <Label htmlFor="comment-type">Comment Type</Label>
              <Select value={commentType} onValueChange={(value: any) => setCommentType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select comment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="question">Question - Need clarification</SelectItem>
                  <SelectItem value="clarification">Clarification - Additional info needed</SelectItem>
                  <SelectItem value="correction">Correction - Error found</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment-text">Comment</Label>
              <Textarea
                id="comment-text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Describe the issue or question in detail..."
                className="min-h-24"
              />
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">Important Notice</p>
                <p className="text-yellow-700">
                  Adding a comment will block invoice generation until PMO reviews and resolves the issue. 
                  An email notification will be sent to the Project Management Office.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!commentText.trim() || isSubmitting}
            className="bg-gradient-primary"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>Send to PMO</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;
