import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Button } from '../components/ui/button';
import { Pencil, ArrowLeft } from 'lucide-react';

const InvoicePreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/invoice/${id}/download`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch PDF');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      })
      .catch(() => setError('Could not load PDF preview.'))
      .finally(() => setLoading(false));
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line
  }, [id]);

  return (
    <div className="flex flex-col items-center justify-start min-h-[100vh] w-full bg-background">
      <div className="flex w-full max-w-5xl items-center justify-between mb-4 mt-4">
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
      <div style={{ width: '100%', height: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        {loading && <div className="text-muted-foreground p-8">Loading PDF preview...</div>}
        {error && <div className="text-destructive p-8">{error}</div>}
        {pdfUrl && !loading && !error && (
          <iframe
            src={pdfUrl}
            title="Invoice PDF Preview"
            width="100%"
            height="100%"
            style={{ border: 'none', width: '100%', height: '100%' }}
          />
        )}
      </div>
      {/* Bottom half of the screen (empty for now) */}
      <div style={{ width: '100%', height: '50vh' }}></div>
    </div>
  );
};

export default InvoicePreview;