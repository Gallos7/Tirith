import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient";

export const Profile = () => {
    const { user, setUser, logout } = useAuth();

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [prevUser, setPrevUser] = useState(null);

    const [formData, setFormData] = useState({
        full_name: user?.full_name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        avatar_url: user?.avatar_url || ""
    });

    if (user !== prevUser) {
        setPrevUser(user);
        if (user) {
            setFormData({
                full_name: user.full_name || "",
                email: user.email || "",
                phone: user.phone || "",
                avatar_url: user.avatar_url || ""
            });
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: "", text: "" });

        try {
            const response = await apiClient.put("/users/profile", {
                full_name: formData.full_name,
                phone: formData.phone,
                avatar_url: formData.avatar_url
            });

            setMessage({ type: "success", text: "Profile updated successfully." });

            if (setUser && response.data) {
                setUser(response.data);
            }

            setTimeout(() => setMessage({ type: "", text: "" }), 3000);

        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.detail || "Failed to update profile. Please try again." });
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const inputStyles = "w-full px-4 py-2.5 bg-[#1e232b] border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:border-[#cda434] focus:ring-1 focus:ring-[#cda434] transition-colors";
    const labelStyles = "block text-xs font-semibold text-[#B0B4A3] uppercase tracking-widest mb-2";

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <Link to="/dashboard" className="text-[#cda434] hover:text-[#b5902b] text-xs font-bold uppercase tracking-widest transition-colors inline-flex items-center mb-4">
                    ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-white tracking-wide">Account Settings</h1>
                <p className="text-sm text-slate-400 mt-2 font-light">Manage your personal information and preferences.</p>
            </div>

            <div className="bg-[#161a20] rounded-xl border border-slate-700/60 shadow-xl p-8 relative overflow-hidden">
                {message.text && (
                    <div className={`mb-8 p-4 rounded-md text-sm font-medium border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex items-center gap-6 pb-8 border-b border-slate-700/60">
                        <div className="w-20 h-20 rounded-full bg-[#1e232b] text-[#B0B4A3] flex items-center justify-center text-2xl font-bold border border-slate-600 shrink-0 overflow-hidden shadow-inner">
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                formData.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"
                            )}
                        </div>
                        <div className="flex-1 max-w-md">
                            <label className={labelStyles}>Avatar URL</label>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={formData.avatar_url}
                                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                className={inputStyles}
                            />
                            <p className="text-[10px] text-slate-500 mt-2">Provide a direct link to an image file.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-slate-700/60">
                        <div>
                            <label className={labelStyles}>Full Name</label>
                            <input
                                required
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className={inputStyles}
                            />
                        </div>
                        <div>
                            <label className={labelStyles}>Email Address</label>
                            <input
                                disabled
                                type="email"
                                value={formData.email}
                                className={`${inputStyles} opacity-60 cursor-not-allowed bg-[#111318]`}
                                title="Email cannot be changed."
                            />
                        </div>
                        <div>
                            <label className={labelStyles}>Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className={inputStyles}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="cursor-pointer disabled:cursor-not-allowed px-6 py-2.5 bg-[#cda434] hover:bg-[#b5902b] text-black text-sm font-bold rounded-md shadow-[0_0_10px_rgba(205,164,52,0.3)] disabled:opacity-50 transition-all"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-[#161a20] rounded-xl border border-red-900/40 shadow-xl p-8 mt-8">
                <h3 className="text-sm font-bold text-red-400 mb-2">Danger Zone</h3>
                <p className="text-xs text-slate-400 mb-4 font-light">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                    onClick={async () => {
                        if (window.confirm("Are you entirely sure you want to deactivate your account?")) {
                            try {
                                await apiClient.delete("/users/profile");
                                logout();
                            } catch (err) {
                                console.error("Failed to deactivate account:", err);
                                alert("Failed to deactivate account. Please try again.");
                            }
                        }
                    }}
                    className="cursor-pointer px-4 py-2 border border-red-900/50 text-red-400 hover:bg-red-900/20 text-xs font-bold rounded shadow-sm transition-colors"
                >
                    Deactivate Account
                </button>
            </div>
        </div>
    );
};