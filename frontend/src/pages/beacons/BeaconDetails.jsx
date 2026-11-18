import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';

import { DeleteBeaconModal } from '../../features/beacons/components/DeleteBeaconModal';
import { EditBeaconModal } from '../../features/beacons/components/EditBeaconModal';
import { TelemetryStrip } from '../../features/beacons/components/TelemetryStrip';
import { ResponseTimeChart } from '../../features/beacons/components/ResponseTimeChart';
import { RecentPingsTable } from '../../features/beacons/components/RecentPingsTable';

export const BeaconDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [site, setSite] = useState(null);
    const [pings, setPings] = useState([]);
    const [graphData, setGraphData] = useState([]);
    const [uptimeData, setUptimeData] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [secondsUntilNextPing, setSecondsUntilNextPing] = useState(0);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchSiteData = useCallback(async () => {
        try {
            const [siteRes, pingsRes, graphRes, uptimeRes] = await Promise.all([
                apiClient.get(`/sites/get_one/${id}`),
                apiClient.get(`/logs/get_one/${id}/logs`),
                apiClient.get(`/sites/${id}/graph-data`),
                apiClient.get(`/sites/${id}/uptime`)
            ]);

            setSite(siteRes.data);
            setPings(Array.isArray(pingsRes.data) ? pingsRes.data : []);

            const formattedGraphData = (graphRes.data || []).map(point => ({
                ...point,
                timeLabel: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            setGraphData(formattedGraphData);
            setUptimeData(uptimeRes.data?.uptime_percentage || 0);
            setError(null);

            if (siteRes.data?.check_interval_seconds) {
                const interval = siteRes.data.check_interval_seconds;
                if (siteRes.data.last_checked_at) {
                    const lastChecked = new Date(siteRes.data.last_checked_at).getTime();
                    const now = Date.now();
                    const elapsed = Math.floor((now - lastChecked) / 1000);
                    const remaining = Math.max(0, interval - (elapsed % interval));
                    setSecondsUntilNextPing(remaining);
                } else {
                    setSecondsUntilNextPing(interval);
                }
            }
        } catch (err) {
            console.error("Failed to fetch site details:", err);
            setError("Failed to load beacon telemetry. It may have been deleted.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            await fetchSiteData();
            if (!isMounted) return;
        };
        load();
        const poll = setInterval(fetchSiteData, 15000);
        return () => {
            isMounted = false;
            clearInterval(poll);
        };
    }, [fetchSiteData]);

    useEffect(() => {
        if (!site?.is_active || secondsUntilNextPing <= 0) return;
        const timer = setInterval(() => {
            setSecondsUntilNextPing(prev => (prev > 1 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [site?.is_active, secondsUntilNextPing]);

    const handleTogglePause = async () => {
        if (!site) return;
        try {
            await apiClient.put(`/sites/update/${id}`, { is_active: !site.is_active });
            fetchSiteData();
        } catch (err) {
            console.error("Failed to toggle status:", err);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await apiClient.delete(`/sites/delete/${id}`);
            navigate('/dashboard');
        } catch (err) {
            console.error("Failed to delete beacon:", err);
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-[#B0B4A3]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#cda434] mb-4"></div>
                Consulting the Palantír...
            </div>
        );
    }

    if (error || !site) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <Link to="/dashboard" className="text-[#cda434] hover:text-[#b5902b] text-sm font-bold transition-colors inline-flex items-center">
                    ← Back to Dashboard
                </Link>
                <div className="p-6 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400">
                    {error || "Beacon not found."}
                </div>
            </div>
        );
    }

    const isPaused = !site.is_active;
    const isUp = site.current_status === 'up';
    const isDown = site.current_status === 'down';

    let statusColor = 'text-slate-400';
    let dotColor = 'bg-slate-500';
    let dotGlow = '';
    let statusText = 'Paused';

    if (!isPaused) {
        if (isUp) {
            statusColor = 'text-emerald-400';
            dotColor = 'bg-emerald-500';
            dotGlow = 'shadow-[0_0_10px_rgba(16,185,129,0.8)]';
            statusText = 'Operational';
        } else if (isDown) {
            statusColor = 'text-red-400';
            dotColor = 'bg-red-500';
            dotGlow = 'shadow-[0_0_10px_rgba(239,68,68,0.8)]';
            statusText = 'Offline';
        } else {
            statusText = 'Pending';
        }
    }

    const cardClass = "bg-[#161a20] rounded-xl border border-slate-700/60 shadow-xl p-6 relative overflow-hidden";

    return (
        <div className="max-w-6xl mx-auto space-y-8 relative">

            <DeleteBeaconModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
                siteName={site.name}
            />

            <EditBeaconModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={fetchSiteData}
                site={site}
            />

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <Link to="/dashboard" className="text-[#cda434] hover:text-[#b5902b] text-xs font-bold uppercase tracking-widest transition-colors inline-flex items-center mb-4">
                        ← Back to Beacons
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="relative flex h-4 w-4 shrink-0">
                            {!isPaused && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-40`}></span>}
                            <span className={`relative inline-flex rounded-full h-4 w-4 ${dotColor} ${dotGlow}`}></span>
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-wide truncate">{site.name}</h1>
                    </div>
                    <div className="flex items-center gap-3 mt-2 ml-8">
                        <span className="text-[10px] font-bold text-[#cda434] bg-[#cda434]/10 border border-[#cda434]/30 px-2 py-0.5 rounded">HTTP/S</span>
                        <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-300 hover:text-[#cda434] hover:underline truncate transition-colors">
                            {site.url}
                        </a>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button onClick={handleTogglePause} className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-[#1e232b] hover:bg-[#252a33] text-[#B0B4A3] hover:text-white text-sm font-bold rounded shadow-sm border border-slate-700 transition-all">
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button onClick={() => setShowEditModal(true)} className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-[#1e232b] hover:bg-[#252a33] text-[#cda434] hover:text-[#b5902b] text-sm font-bold rounded shadow-sm border border-slate-700 transition-all">
                        Edit Settings
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-[#1e232b] hover:bg-red-900/20 text-slate-400 hover:text-red-400 text-sm font-bold rounded shadow-sm border border-slate-700 hover:border-red-900/50 transition-all">
                        Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={cardClass}>
                    <h3 className="text-xs font-semibold text-[#B0B4A3] uppercase tracking-widest mb-4">Current Status</h3>
                    <div className="flex items-end gap-3">
                        <span className={`text-3xl font-bold ${statusColor} drop-shadow-sm`}>{statusText}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2 font-light">
                        {isPaused ? "Monitoring is suspended." : "Checked remotely from Tirith Worker."}
                    </p>
                </div>

                <div className={cardClass}>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xs font-semibold text-[#B0B4A3] uppercase tracking-widest">Last Check</h3>
                        {!isPaused && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0a0a0c] border border-slate-700/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#cda434] animate-pulse"></span>
                                <span className="text-[10px] uppercase tracking-wider text-[#B0B4A3]">Next:</span>
                                <span className="text-xs font-mono font-bold text-[#cda434]">{secondsUntilNextPing}s</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-white drop-shadow-sm">
                            {pings[0]?.response_time != null ? `${pings[0].response_time}ms` : (site.last_response_time ? `${site.last_response_time}ms` : '--')}
                        </span>
                        <span className="text-sm text-slate-400 font-medium mb-1">response</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2 font-light">
                        Checking every <strong className="text-slate-200">{site.check_interval_seconds / 60} {site.check_interval_seconds === 60 ? 'minute' : 'minutes'}</strong>
                    </p>
                </div>

                <div className={cardClass}>
                    <h3 className="text-xs font-semibold text-[#B0B4A3] uppercase tracking-widest mb-4">Last 24 Hours</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">{uptimeData}%</span>
                        <span className="text-sm text-slate-400 font-medium mb-1">uptime</span>
                    </div>
                    <div className="flex items-center gap-1 mt-3 h-6">
                        {[...Array(40)].map((_, i) => (
                            <div key={i} className="flex-1 h-full rounded-sm opacity-90" style={{ backgroundColor: `color-mix(in srgb, #10b981 ${(i / 39) * 100}%, #B0B4A3)` }}></div>
                        ))}
                    </div>
                </div>
            </div>

            <TelemetryStrip pings={pings} />
            <ResponseTimeChart graphData={graphData} />
            <RecentPingsTable pings={pings} />

        </div>
    );
};