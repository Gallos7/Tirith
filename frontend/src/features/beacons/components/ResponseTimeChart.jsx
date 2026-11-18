import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * ResponseTimeChart: Visualizes historical telemetry data over a 24-hour axis.
 * Uses a Recharts ResponsiveContainer to ensure mobile elasticity.
 */
export const ResponseTimeChart = ({ graphData }) => {
    return (
        <div className="bg-[#161a20] rounded-xl border border-slate-700/60 shadow-xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-semibold text-[#B0B4A3] uppercase tracking-widest">Response Time (24h)</h3>
            </div>

            {graphData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-700/50 rounded-lg bg-[#0a0a0c]/50">
                    <h4 className="text-sm font-bold text-slate-300">Gathering telemetry...</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">The chart will populate as the worker runs checks.</p>
                </div>
            ) : (
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#cda434" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#cda434" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="timeLabel" stroke="#B0B4A3" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#B0B4A3" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}ms`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#161a20', borderColor: '#cda434', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#cda434' }}
                            />
                            <Area type="monotone" dataKey="response_time" name="Response" stroke="#cda434" strokeWidth={2} fillOpacity={1} fill="url(#colorResponse)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};