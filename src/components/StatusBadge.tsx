import { cn } from '../lib/utils';
import { InvoiceStatus } from '../types';
import { Badge } from './ui/badge';

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusStyles = (status: InvoiceStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-status-draft text-foreground';
      case 'Pending L2':
      case 'Pending L3':
        return 'bg-status-pending text-foreground';
      case 'Approved':
        return 'bg-status-approved text-success-foreground';
      case 'Rejected':
        return 'bg-status-rejected text-destructive-foreground';
      case 'Dispatched':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Badge className={cn(getStatusStyles(status), className)}>
      {status}
    </Badge>
  );
};

export default StatusBadge;