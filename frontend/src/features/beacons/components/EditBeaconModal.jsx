import { useState } from 'react';
import apiClient from '../../../services/apiClient';
import { IntervalSlider } from '../../../components/ui/IntervalSlider';

/**
 * EditBeaconModal: Mutates existing monitor configurations.
 * Utilizes derived state to populate the form instantly when the modal is invoked.
 */
export const EditBeaconModal = ({ isOpen, onClose, onSuccess, site }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [prevIsOpen, setPrevIsOpen] = useState(false);

    const [editForm, setEditForm] = useState({
        name: site?.name || '',
        url: site?.url || '',
        check_interval_seconds: site?.check_interval_seconds || 60
    });

    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen && site) {
            setEditForm({
                name: site.name,
                url: site.url,
                check_interval_seconds: site.check_interval_seconds
            });
        }
    }

    if (!isOpen || !site) return null;

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setIsEditing(true);
        try {
            await apiClient.put(`/sites/update/${site.id}`, editForm);
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to update beacon:", err);
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0c] rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden flex flex-col border border-slate-700">
                <div className="p-5 border-b border-slate-700/60 flex justify-between items-center bg-[#161a20]">
                    <h2 className="text-lg font-bold text-white tracking-wide">Edit Beacon Settings</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-[#cda434] transition-colors cursor-pointer">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleUpdateSettings} className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-[#B0B4A3] uppercase tracking-widest mb-2">Service Name</label>
                        <input
                            type="text"
                            required
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-[#1e232b] border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:border-[#cda434] focus:ring-1 focus:ring-[#cda434]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[#B0B4A3] uppercase tracking-widest mb-2">Target URL</label>
                        <input
                            type="url"
                            required
                            value={editForm.url}
                            onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                            className="w-full px-4 py-2.5 bg-[#1e232b] border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:border-[#cda434] focus:ring-1 focus:ring-[#cda434]"
                        />
                    </div>
                    <IntervalSlider
                        value={editForm.check_interval_seconds}
                        onChange={(val) => setEditForm({ ...editForm, check_interval_seconds: val })}
                    />
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isEditing}
                            className="cursor-pointer disabled:cursor-not-allowed px-5 py-2.5 text-sm font-medium border border-slate-600 text-[#B0B4A3] rounded-md hover:bg-slate-800 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isEditing}
                            className="cursor-pointer disabled:cursor-not-allowed px-5 py-2.5 bg-[#cda434] hover:bg-[#b5902b] text-black text-sm font-bold rounded-md shadow-[0_0_10px_rgba(205,164,52,0.3)] transition-all disabled:opacity-50"
                        >
                            {isEditing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};