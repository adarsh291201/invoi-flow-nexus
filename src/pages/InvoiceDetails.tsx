import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Eye, Pencil, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import StatusBadge from '../components/StatusBadge';

const InvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [projectInvoices, setProjectInvoices] = useState<any[]>([]);
  const [projectInvoicesLoading, setProjectInvoicesLoading] = useState(false);
  const [projectInvoicesError, setProjectInvoicesError] = useState<string | null>(null);
  const [selectedInvoicePreview, setSelectedInvoicePreview] = useState<string | null>(null);
  const [selectedInvoicePreviewOpen, setSelectedInvoicePreviewOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/invoice/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch invoice details');
        return res.json();
      })
      .then(data => {
        setInvoice(data.configuration);
      })
      .catch(() => setError('Could not load invoice details.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch comments
  useEffect(() => {
    if (!id) return;
    setCommentLoading(true);
    fetch(`/invoice/${id}/comments`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setComments(data))
      .catch(() => setCommentError('Could not load comments.'))
      .finally(() => setCommentLoading(false));
  }, [id]);

  // Fetch PDF on mount
  useEffect(() => {
    if (!id) return;
    setPdfUrl(null);
    fetch(`/invoice/${id}/download`)
      .then(res => res.ok ? res.blob() : Promise.reject())
      .then(blob => setPdfUrl(URL.createObjectURL(blob)))
      .catch(() => setPdfUrl(null));
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [id]);

  // Fetch project invoices
  useEffect(() => {
    if (!invoice?.projectId) return;
    setProjectInvoicesLoading(true);
    setProjectInvoicesError(null);
    fetch(`/invoice/project/${invoice.projectId}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setProjectInvoices(data))
      .catch(() => setProjectInvoicesError('Could not load project invoices.'))
      .finally(() => setProjectInvoicesLoading(false));
  }, [invoice?.projectId]);

  // Add comment handler
  const handleAddComment = async () => {
    if (!id || !user || !newComment.trim()) return;
    setSubmitting(true);
    setCommentError(null);
    try {
      const res = await fetch(`/invoice/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newComment,
          userName: user.name,
          userRole: user.role,
          userId: user.id || ''
        })
      });
      if (!res.ok) throw new Error('Failed to add comment');
      setNewComment('');
      // Refetch comments
      const commentsRes = await fetch(`/invoice/${id}/comments`);
      setComments(commentsRes.ok ? await commentsRes.json() : []);
    } catch {
      setCommentError('Failed to add comment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Approve handler
  const handleApprove = async () => {
    if (!id || !user) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/invoice/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userRole: user.role })
      });
      if (!res.ok) throw new Error('Failed to approve invoice');
      const data = await res.json();
      setInvoice((prev: any) => ({ ...prev, status: data.status }));
    } catch {
      setActionError('Failed to approve invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject handler (for L2/L3)
  const handleReject = async () => {
    if (!id || !user) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/invoice/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userRole: user.role })
      });
      if (!res.ok) throw new Error('Failed to reject invoice');
      const data = await res.json();
      setInvoice((prev: any) => ({ ...prev, status: data.status }));
    } catch {
      setActionError('Failed to reject invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  // PM Request handler (for L1)
  const handlePMRequest = async () => {
    if (!id || !user) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/invoice/${id}/pm-request`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userRole: user.role })
      });
      if (!res.ok) throw new Error('Failed to request PM intervention');
      const data = await res.json();
      setInvoice((prev: any) => ({ ...prev, status: data.status }));
    } catch {
      setActionError('Failed to request PM intervention.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!id) return;
    setPdfUrl(null);
    setPreviewOpen(true);
    try {
      const response = await fetch(`/invoice/${id}/download`);
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch {
      setPdfUrl(null);
    }
  };

  // Handle preview for project invoices
  const handleProjectInvoicePreview = async (invoiceId: string) => {
    try {
      const res = await fetch(`/invoice/${invoiceId}/download`);
      if (!res.ok) throw new Error('Failed to fetch PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setSelectedInvoicePreview(url);
      setSelectedInvoicePreviewOpen(true);
    } catch (error) {
      console.error('Error loading invoice preview:', error);
    }
  };

  // Clean up selected invoice preview URL
  useEffect(() => {
    return () => {
      if (selectedInvoicePreview) {
        URL.revokeObjectURL(selectedInvoicePreview);
      }
    };
  }, [selectedInvoicePreview]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading invoice details...</div>;
  }
  if (error || !invoice) {
    return <div className="flex items-center justify-center h-64 text-destructive">{error || 'Invoice not found.'}</div>;
  }

  return (
    <div className="flex flex-col min-h-[100vh] w-full bg-background">
      <div className="flex w-full max-w-7xl items-start justify-center mt-8 mx-auto gap-16 flex-col md:flex-row">
        {/* Left: PDF Preview */}
        <div className="flex-1 min-w-[400px] max-w-3xl">
          <div className="w-full shadow-card rounded p-4 flex items-center justify-center" style={{height: '700px', backgroundColor: 'rgb(6, 65, 115)'}}>
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                width="100%"
                height="100%"
                style={{ border: 'none', minHeight: '600px', minWidth: '100%' }}
                title="Invoice PDF Preview"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading PDF...</div>
            )}
          </div>
        </div>
        {/* Right: Comments Section */}
        <div className="flex-1 min-w-[380px] max-w-lg bg-white rounded shadow p-6 flex flex-col" style={{height: '700px'}}>
          {/* Header */}
          <div className="flex w-full items-center justify-between mb-4">
            <Button variant="outline" onClick={() => navigate('/invoices')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
            {user?.role === 'L1' && id && (
              <Button variant="blue" onClick={() => navigate(`/invoice/edit/${id}`)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Invoice
              </Button>
            )}
          </div>
          
          {actionError && <div className="text-destructive mb-3">{actionError}</div>}
          
          {/* Add Comment Section - Fixed height */}
          <div className="mb-4">
            <Label htmlFor="add-comment" className="font-semibold text-lg mb-2 block">Add Comment</Label>
            <Textarea
              id="add-comment"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write your comment..."
              rows={3}
              className="mb-2"
              disabled={submitting}
            />
            <div className="flex items-center justify-between">
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submitting}
                className="text-white"
                style={{ backgroundColor: 'rgb(6, 65, 115)' }}
              >
                {submitting ? 'Adding...' : 'Add Comment'}
              </Button>
              {/* Approve/Reject/PM Request buttons based on status/role */}
              <div className="flex items-center gap-2">
                {user && invoice.status === 'L1 Pending' && user.role === 'L1' && (
                  <>
                    <Button onClick={handleApprove} disabled={actionLoading} className="bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1 text-sm">Approve</Button>
                    <Button onClick={handlePMRequest} disabled={actionLoading} className="bg-amber-500 text-white hover:bg-amber-600 px-3 py-1 text-sm">PM Request</Button>
                  </>
                )}
                {user && invoice.status === 'L2 Pending' && user.role === 'L2' && (
                  <>
                    <Button onClick={handleApprove} disabled={actionLoading} className="bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1 text-sm">Approve</Button>
                    <Button onClick={handleReject} disabled={actionLoading} className="bg-rose-500 text-white hover:bg-rose-600 px-3 py-1 text-sm">Reject</Button>
                  </>
                )}
                {user && invoice.status === 'L3 Pending' && user.role === 'L3' && (
                  <>
                    <Button onClick={handleApprove} disabled={actionLoading} className="bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1 text-sm">Approve</Button>
                    <Button onClick={handleReject} disabled={actionLoading} className="bg-rose-500 text-white hover:bg-rose-600 px-3 py-1 text-sm">Reject</Button>
                  </>
                )}
                {user && invoice.status === 'PM Pending' && user.role === 'PM' && (
                  <Button onClick={handleApprove} disabled={actionLoading} className="bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1 text-sm">Approve</Button>
                )}
              </div>
            </div>
            {commentError && <div className="text-destructive mt-2">{commentError}</div>}
          </div>
          
          {/* Comment History Section - Scrollable */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="font-semibold text-lg mb-2">Comment History</div>
            {commentLoading ? (
              <div className="text-muted-foreground">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-muted-foreground">No comments yet.</div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {comments.map((c, idx) => (
                  <div key={idx} className="border-l-2 border-primary/20 pl-4 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-sm">{c.userRole} - {c.userName}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{new Date(c.date).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-1 text-sm">{c.commentText}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Previous Invoices Table */}
      <div className="flex w-full max-w-7xl items-start justify-center mt-8 mx-auto">
        <div className="w-full bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'rgb(6, 65, 115)', fontFamily: 'Inter, system-ui, sans-serif' }}>Previous Invoices</h2>
              <p className="text-muted-foreground font-medium">All invoices for project: {invoice.projectId}</p>
            </div>
          </div>

          {projectInvoicesLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground font-medium">Loading previous invoices...</div>
          ) : projectInvoicesError ? (
            <div className="flex items-center justify-center h-32 text-destructive font-medium">{projectInvoicesError}</div>
          ) : projectInvoices.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground font-medium">No previous invoices found for this project.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ border: `1px solid rgb(6, 65, 115, 0.3)` }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgb(6, 65, 115)' }}>
                    <th className="text-left p-4 text-white font-semibold" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Project ID</th>
                    <th className="text-left p-4 text-white font-semibold" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Account ID</th>
                    <th className="text-left p-4 text-white font-semibold" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Status</th>
                    <th className="text-left p-4 text-white font-semibold" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Invoice Month</th>
                    <th className="text-left p-4 text-white font-semibold" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Created Date</th>
                    <th className="text-left p-4 text-white font-semibold" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projectInvoices.map((projectInvoice) => (
                    <tr 
                      key={projectInvoice.id} 
                      className="border-b hover:bg-muted/50"
                      style={{ borderColor: 'rgb(6, 65, 115)' }}
                    >
                      <td className="p-4 font-mono text-sm font-medium">{projectInvoice.projectId}</td>
                      <td className="p-4 font-medium">{projectInvoice.accountId}</td>
                      <td className="p-4">
                        <StatusBadge status={projectInvoice.status} />
                      </td>
                      <td className="p-4 font-medium">{projectInvoice.month} {projectInvoice.year}</td>
                      <td className="p-4 text-sm font-medium">{new Date(projectInvoice.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleProjectInvoicePreview(projectInvoice.invoiceConfigId)}
                            style={{ borderColor: 'rgb(6, 65, 115)', color: 'rgb(6, 65, 115)' }}
                            className="hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Invoice PDF Preview</DialogTitle>
          </DialogHeader>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              width="100%"
              height="100%"
              style={{ flex: 1, border: 'none', minHeight: '70vh' }}
              title="Invoice PDF Preview"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading PDF...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Project Invoice Preview Modal */}
      <Dialog open={selectedInvoicePreviewOpen} onOpenChange={setSelectedInvoicePreviewOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Project Invoice Preview</DialogTitle>
          </DialogHeader>
          {selectedInvoicePreview ? (
            <iframe
              src={selectedInvoicePreview}
              width="100%"
              height="100%"
              style={{ flex: 1, border: 'none', minHeight: '70vh' }}
              title="Project Invoice PDF Preview"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading PDF...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceDetails; 