import React from 'react';

const InsightCard = ({
    children,
    className = "",
    onClick,
    variant = "default", // default, danger, highlight
    noPadding = false
}) => {

    let variantClasses = "glass-panel border-white/5";

    if (variant === 'danger') {
        variantClasses = "bg-rose-500/5 border-rose-500/20";
    } else if (variant === 'highlight') {
        variantClasses = "bg-indigo-500/5 border-indigo-500/20";
    }

    return (
        <div
            onClick={onClick}
            className={`
                relative rounded-2xl border transition-all duration-500
                ${variantClasses}
                ${noPadding ? 'p-0' : 'p-5'}
                ${onClick ? 'cursor-pointer hover:border-white/20 hover:bg-white/5 active:scale-[0.98]' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export default InsightCard;

