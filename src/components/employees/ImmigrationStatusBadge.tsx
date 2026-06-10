import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertTriangle, XCircle, Clock, FileQuestion } from "lucide-react";

interface ImmigrationStatusBadgeProps {
  status?: 'pending_review' | 'approved' | 'rejected' | 'expired' | 'requires_renewal';
}

export const ImmigrationStatusBadge = ({ status = 'pending_review' }: ImmigrationStatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          variant: 'default' as const,
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
          description: 'All immigration documents are valid and current'
        };
      case 'expired':
        return {
          label: 'Expired',
          variant: 'destructive' as const,
          icon: XCircle,
          className: 'bg-red-100 text-red-800 hover:bg-red-200',
          description: 'One or more immigration documents have expired'
        };
      case 'requires_renewal':
        return {
          label: 'Requires Renewal',
          variant: 'secondary' as const,
          icon: AlertTriangle,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
          description: 'Documents expire within 30 days and require renewal'
        };
      case 'rejected':
        return {
          label: 'Rejected',
          variant: 'destructive' as const,
          icon: XCircle,
          className: 'bg-red-100 text-red-800 hover:bg-red-200',
          description: 'One or more documents have been rejected or are invalid'
        };
      case 'pending_review':
      default:
        return {
          label: 'Pending Review',
          variant: 'outline' as const,
          icon: Clock,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
          description: 'Immigration documents are missing or under review'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`flex items-center gap-1 ${config.className}`}>
            <Icon className="h-3 w-3" />
            Status: {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{config.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Status updates automatically based on document validity
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};