import React from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import Icons from './Icons';

/**
 * LagNotifier Component
 * Displays a notification when performance lag is detected.
 * Shows the cause of the lag and auto-dismisses after 5 seconds.
 */
const LagNotifier = () => {
    const { lagMetrics } = useDashboard();

    if (!lagMetrics?.isLagging || !lagMetrics?.lagCause) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-[100] animate-fade-in">
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg shadow-lg p-4 max-w-sm">
                <div className="flex items-start gap-3">
                    <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                        <Icons.AlertTriangle size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                            Performance Warning
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            {lagMetrics.lagCause}
                        </p>
                        {lagMetrics.slowOperations?.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                                    Recent Slow Operations:
                                </span>
                                {lagMetrics.slowOperations.slice(-3).map((op, i) => (
                                    <div key={i} className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                                        • {op.name}: {(op.duration / 1000).toFixed(1)}s
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LagNotifier;
