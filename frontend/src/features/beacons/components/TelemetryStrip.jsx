/**
 * TelemetryStrip: Statistical aggregate component.
 * Computes min, max, and average latencies across the provided dataset on the fly.
 */
export const TelemetryStrip = ({ pings }) => {
    const validResponseTimes = pings.filter(p => p.response_time != null).map(p => p.response_time);

    if (validResponseTimes.length === 0) return null;

    const avgLatency = Math.round(validResponseTimes.reduce((a, b) => a + b, 0) / validResponseTimes.length);
    const minLatency = Math.min(...validResponseTimes);
    const maxLatency = Math.max(...validResponseTimes);

    return (
        <div className="bg-[#0a0a0c] rounded-lg border border-slate-700/60 p-4 flex flex-wrap items-center justify-around gap-4 text-center">
            <div>
                <div className="text-[10px] uppercase tracking-widest text-[#B0B4A3] font-semibold">Avg Latency</div>
                <div className="text-lg font-mono font-bold text-white mt-0.5">{avgLatency}ms</div>
            </div>
            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
            <div>
                <div className="text-[10px] uppercase tracking-widest text-[#B0B4A3] font-semibold">Min Latency</div>
                <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">{minLatency}ms</div>
            </div>
            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
            <div>
                <div className="text-[10px] uppercase tracking-widest text-[#B0B4A3] font-semibold">Max Latency</div>
                <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">{maxLatency}ms</div>
            </div>
            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
            <div>
                <div className="text-[10px] uppercase tracking-widest text-[#B0B4A3] font-semibold">Sample Size</div>
                <div className="text-lg font-mono font-bold text-slate-300 mt-0.5">
                    {validResponseTimes.length} {validResponseTimes.length === 1 ? 'ping' : 'pings'}
                </div>
            </div>
        </div>
    );
};