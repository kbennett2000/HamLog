import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (choice: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--color-surface-900)]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-2xl shadow-modal w-full max-w-sm p-6 animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-danger-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-danger-500" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            Confirm Deletion
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Are you sure you want to delete this QSO? This action cannot be undone.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => onClose()}
              className="flex-1 px-4 py-2 bg-[var(--color-surface-100)] text-[var(--color-text-secondary)] text-sm font-medium rounded-lg hover:bg-[var(--color-surface-200)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm('Yes')}
              className="flex-1 px-4 py-2 bg-danger-600 text-white text-sm font-medium rounded-lg hover:bg-danger-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
