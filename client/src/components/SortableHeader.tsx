import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { SortField, SortConfig } from '../types/qso';

interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentSort: SortConfig;
  onSort: (field: SortField) => void;
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, field, currentSort, onSort, className }) => {
  const isActive = currentSort.field === field;

  return (
    <th
      scope="col"
      className={`${className || ''} cursor-pointer select-none hover:text-white transition-colors`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && (
          currentSort.direction === 'asc'
            ? <ArrowUp className="w-3 h-3" />
            : <ArrowDown className="w-3 h-3" />
        )}
      </span>
    </th>
  );
};

export default SortableHeader;
