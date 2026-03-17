import type { DocStatus } from '../types';

const STATUS_CONFIG: Record<DocStatus, { label: string; className: string }> = {
  DRAFT: { label: '검토', className: 'bg-yellow-100 text-yellow-700 border border-yellow-300' },
  REVIEW: { label: '검토', className: 'bg-yellow-100 text-yellow-700 border border-yellow-300' },
  APPROVED: { label: '승인', className: 'bg-green-100 text-green-700 border border-green-300' },
};

export const StatusBadge = ({ status }: { status: DocStatus }) => {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
};
