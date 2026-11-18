import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { NewMonitorModal } from '../../features/beacons/components/NewMonitorModal';

export const Dashboard = () => {
    const navigate = useNavigate();
    const [sites, setSites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchSites = useCallback(async () => {
        try {
            const response = await apiClient.get('/sites/get_all');
            setSites(Array.isArray(response.data) ? response.data : response.data.items || []);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch sites:", err);
            setSites(prev => {
                if (prev.length === 0) setError("Failed to load monitors. Please try again.");
                return prev;
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const initializeDashboard = async () => {
            await fetchSites();
        };

        initializeDashboard();
        const fetchInterval = setInterval(fetchSites, 15000);

        return () => clearInterval(fetchInterval);
    }, [fetchSites]);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-5xl tracking-wide text-gray-100 font-['Pinyon_Script'] drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">Beacons</h1>
                    <p className="text-base text-[#B0B4A3] mt-1 font-light tracking-wide">Overview of your infrastructure status</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="cursor-pointer inline-flex items-center justify-center px-5 py-2.5 bg-[#cda434] hover:bg-[#b5902b] text-black text-sm font-bold rounded-md shadow-[0_0_10px_rgba(205,164,52,0.3)] transition-all border border-transparent focus:outline-none focus:ring-2 focus:ring-[#cda434] focus:ring-offset-2 focus:ring-offset-[#0a0a0c]"
                >
                    <svg className="w-5 h-5 mr-2 -ml-1 text-black/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Monitor
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-[#0a0a0c] rounded-xl border border-slate-600 overflow-hidden shadow-2xl">
                {isLoading ? (
                    <div className="p-10 text-center text-[#B0B4A3] text-base">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#cda434] mx-auto mb-4"></div>
                        Lighting the beacons...
                    </div>
                ) : sites.length === 0 ? (
                    <div className="p-16 text-center">
                        <h3 className="text-lg font-bold text-white mb-2">No monitors configured</h3>
                        <p className="text-base text-[#B0B4A3]">Get started by creating a new monitor.</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {sites.map((site) => {
                            const isUp = site.current_status === 'up';
                            const isDown = site.current_status === 'down';
                            const isPaused = !site.is_active;

                            let dotColor = 'bg-[#B0B4A3]';
                            let dotGlow = '';
                            let statusText = 'Paused';

                            if (!isPaused) {
                                if (isUp) {
                                    dotColor = 'bg-emerald-500';
                                    dotGlow = 'shadow-[0_0_10px_rgba(16,185,129,0.6)]';
                                    statusText = 'Up';
                                } else if (isDown) {
                                    dotColor = 'bg-red-500';
                                    dotGlow = 'shadow-[0_0_10px_rgba(239,68,68,0.8)]';
                                    statusText = 'Down';
                                } else {
                                    statusText = 'Pending';
                                }
                            }

                            return (
                                <div
                                    key={site.id}
                                    onClick={() => navigate(`/dashboard/beacon/${site.id}`)}
                                    className="flex items-center justify-between py-3.5 px-6 border-b border-slate-700/60 hover:bg-[#1e232b] cursor-pointer transition-all duration-200 group last:border-0"
                                >
                                    <div className="flex items-center gap-4 min-w-0 w-2/5">
                                        <div className="relative flex h-2.5 w-2.5 shrink-0">
                                            {!isPaused && (
                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-50`}></span>
                                            )}
                                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor} ${dotGlow}`}></span>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-bold text-white truncate group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
                                                {site.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] font-bold text-[#B0B4A3] uppercase tracking-widest bg-transparent border border-[#B0B4A3]/40 px-1.5 py-0.5 rounded shadow-sm leading-none">HTTP</span>
                                                <span className="text-xs text-[#B0B4A3] truncate font-medium">{statusText}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 lg:gap-8 justify-end flex-1">
                                        <div className="hidden lg:flex items-baseline gap-1.5">
                                            <span className="text-[9px] font-semibold text-[#B0B4A3] uppercase tracking-widest">Interval:</span>
                                            <span className="text-xs text-slate-200 font-mono font-medium drop-shadow-[0_0_5px_rgba(148,163,184,0.5)]">
                                                {site.check_interval_seconds / 60}m
                                            </span>
                                        </div>

                                        <div className="hidden md:flex items-center gap-0.75">
                                            {[...Array(24)].map((_, i) => {
                                                const intensity = (i / 23) * 100;
                                                return (
                                                    <div
                                                        key={i}
                                                        className="w-1.5 h-4 rounded-sm transition-all duration-200 group-hover:scale-y-110"
                                                        style={{ backgroundColor: `color-mix(in srgb, #10b981 ${intensity}%, #B0B4A3)` }}
                                                    ></div>
                                                );
                                            })}
                                        </div>

                                        <div className="hidden sm:block text-right w-10">
                                            <span className="text-xs font-bold text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">100%</span>
                                        </div>

                                        <div className="text-slate-600 group-hover:text-[#cda434] transition-colors pl-1">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <NewMonitorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchSites}
            />
        </div>
    );
};