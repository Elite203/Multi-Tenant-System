import { TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortDirection } from "@/hooks/useSorting";

interface SortableTableHeadProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort: { key: string; direction: SortDirection };
  onSort: (key: string) => void;
  className?: string;
}

export function SortableTableHead({ 
  children, 
  sortKey, 
  currentSort, 
  onSort, 
  className 
}: SortableTableHeadProps) {
  const isActive = currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  const getSortIcon = () => {
    if (!isActive || direction === null) {
      return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
    }
    return direction === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <TableHead 
      className={cn(
        "cursor-pointer select-none hover:bg-muted/50 transition-colors",
        isActive && "bg-muted/30",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {children}
        {getSortIcon()}
      </div>
    </TableHead>
  );
}