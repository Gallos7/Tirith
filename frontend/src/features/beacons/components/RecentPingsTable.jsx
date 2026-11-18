/**
 * RecentPingsTable: A tabular log of the 10 most recent automated health checks.
 * Conditionally renders error messages and status badges based on endpoint HTTP codes.
 */
export const RecentPingsTable = ({ pings }) => {
    return (
        <div className="bg-[#161a20] rounded-xl border border-slate-700/60 shadow-xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-semibold text-[#B0B4A3] uppercase tracking-widest">Recent Pings</h3>
                <span className="text-xs font-medium text-slate-400 bg-[#0a0a0c] px-3 py-1 rounded-full border border-slate-700/50">Latest Pings</span>
            </div>

            {pings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-700/50 rounded-lg bg-[#0a0a0c]/50">
                    <h4 className="text-sm font-bold text-slate-300">No telemetry history yet</h4>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-700/50">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#0a0a0c] text-[10px] font-semibold text-[#B0B4A3] uppercase tracking-widest border-b border-slate-700/50">
                                <th className="px-4 py-3 font-medium">Timestamp</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Response Time</th>
                                <th className="px-4 py-3 font-medium">Message</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 text-sm">
                            {pings.slice(0, 10).map((ping) => (
                                <tr key={ping.id} className="hover:bg-[#1e232b] transition-colors">
                                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                                        {new Date(ping.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ping.is_up ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {ping.is_up ? 'Success' : 'Failed'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-300 font-mono">
                                        {ping.response_time ? `${ping.response_time}ms` : '--'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 truncate max-w-xs" title={ping.error_message || "OK"}>
                                        {ping.error_message || "OK"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};