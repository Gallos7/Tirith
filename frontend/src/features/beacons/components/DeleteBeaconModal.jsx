/**
 * DeleteBeaconModal: A destructive action confirmation barrier.
 * Halts accidental deletions of target sites and their associated cascading telemetry history.
 */
export const DeleteBeaconModal = ({ isOpen, onClose, onConfirm, isDeleting, siteName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#161a20] border border-red-900/50 rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="shrink-0 w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Delete Beacon</h3>
                        <p className="text-sm text-slate-400 mt-1">This action cannot be undone.</p>
                    </div>
                </div>
                <p className="text-sm text-slate-300 mb-6">
                    Are you sure you want to permanently delete <strong className="text-white">{siteName}</strong> and all of its telemetry history?
                </p>
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="cursor-pointer disabled:cursor-not-allowed px-4 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="cursor-pointer disabled:cursor-not-allowed px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded shadow-sm transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};