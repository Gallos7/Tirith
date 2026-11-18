// Pre-defined interval milestones optimized for the backend worker polling logic
const INTERVAL_STEPS = [
    { label: '1m', value: 60 },
    { label: '2m', value: 120 },
    { label: '5m', value: 300 },
    { label: '15m', value: 900 },
    { label: '30m', value: 1800 },
    { label: '1h', value: 3600 },
    { label: '6h', value: 21600 },
    { label: '12h', value: 43200 },
    { label: '24h', value: 86400 },
];

/**
 * IntervalSlider: A controlled UI component for selecting polling frequencies.
 * Maps human-readable time labels (e.g., "1m") to raw seconds for database storage.
 */
export const IntervalSlider = ({ value, onChange }) => {
    // Calculates the nearest valid step in case a legacy/custom database value is passed in
    const currentIndex = INTERVAL_STEPS.reduce((closestIdx, step, idx) => {
        const currentDiff = Math.abs(step.value - value);
        const closestDiff = Math.abs(INTERVAL_STEPS[closestIdx].value - value);
        return currentDiff < closestDiff ? idx : closestIdx;
    }, 0);

    const handleSliderChange = (e) => {
        const index = parseInt(e.target.value, 10);
        onChange(INTERVAL_STEPS[index].value);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[#B0B4A3] uppercase tracking-widest">Check Interval</span>
                <span className="text-xs font-mono font-bold text-[#cda434] bg-[#1e232b] px-2.5 py-1 rounded border border-slate-700">
                    Every {INTERVAL_STEPS[currentIndex].label}
                </span>
            </div>

            <div className="relative pt-2 pb-1">
                <input
                    type="range"
                    min="0"
                    max={INTERVAL_STEPS.length - 1}
                    step="1"
                    value={currentIndex}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-[#1e232b] rounded-lg appearance-none cursor-pointer accent-[#cda434] border border-slate-700"
                />

                <div className="flex justify-between px-1 mt-2">
                    {INTERVAL_STEPS.map((step, idx) => (
                        <button
                            type="button"
                            key={step.value}
                            onClick={() => onChange(step.value)}
                            className={`text-[10px] font-mono transition-colors cursor-pointer ${currentIndex === idx ? 'text-[#cda434] font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {step.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};