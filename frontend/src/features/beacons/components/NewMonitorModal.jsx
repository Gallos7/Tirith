import { useState } from "react";
import apiClient from "../../../services/apiClient";
import { IntervalSlider } from "../../../components/ui/IntervalSlider";

/**
 * NewMonitorModal: Handles the creation flow for a new telemetry target.
 * Executes the POST request and commands the parent component to refresh its state upon success.
 */
export const NewMonitorModal = ({ isOpen, onClose, onSuccess }) => {
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        url: "",
        check_interval_seconds: 120,
        is_active: true
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            await apiClient.post("/sites/create", formData);
            setFormData({ name: "", url: "", check_interval_seconds: 120, is_active: true });
            onSuccess();
            onClose();
        } catch (error) {
            alert(`Failed to light beacon: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const inputClasses = "w-full px-4 py-2.5 bg-[#1e232b] border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:border-[#cda434] focus:ring-1 focus:ring-[#cda434] transition-colors placeholder-slate-500 font-mono";
    const labelClasses = "block text-xs font-semibold text-[#B0B4A3] uppercase tracking-widest mb-2";

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#0a0a0c] rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden flex flex-col border border-slate-700">

                <div className="p-5 border-b border-slate-700/60 flex justify-between items-center bg-[#161a20]">
                    <h2 className="text-lg font-bold text-white tracking-wide">Light a New Beacon</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-[#cda434] transition-colors cursor-pointer">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <form id="new-monitor-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className={labelClasses}>Service Name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g., Production Database"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Target URL</label>
                            <input
                                required
                                type="url"
                                placeholder="https://api.yourdomain.com/health"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                        <IntervalSlider
                            value={formData.check_interval_seconds}
                            onChange={(val) => setFormData({ ...formData, check_interval_seconds: val })}
                        />
                    </form>
                </div>

                <div className="p-5 border-t border-slate-700/60 flex justify-end gap-3 bg-[#0a0a0c]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer px-5 py-2.5 text-sm font-medium border border-slate-600 text-[#B0B4A3] rounded-md hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="new-monitor-form"
                        disabled={isSaving}
                        className="cursor-pointer disabled:cursor-not-allowed px-5 py-2.5 bg-[#cda434] hover:bg-[#b5902b] text-black text-sm font-bold rounded-md shadow-[0_0_10px_rgba(205,164,52,0.3)] transition-all disabled:opacity-50"
                    >
                        {isSaving ? "Lighting..." : "Create Monitor"}
                    </button>
                </div>
            </div>
        </div>
    );
};