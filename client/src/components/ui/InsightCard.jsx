import React from 'react';

const InsightCard = ({
    children,
    className = "",
    onClick,
    variant = "default", // default, danger, highlight
    noPadding = false
}) => {

    // Base classes for the new "Grammarly/Stripe" aesthetic
    // - card-base: defined in global.css (white bg, soft shadow, border)
    // - transition: smooth hover states

    let variantClasses = "bg-tip-surface border-tip-border";

    if (variant === 'danger') {
        variantClasses = "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50";
    } else if (variant === 'highlight') {
        variantClasses = "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50";
    }

    return (
        <div
            onClick={onClick}
            className={`
                relative rounded-xl border transition-all duration-300
                ${variantClasses}
                ${noPadding ? 'p-0' : 'p-6'}
                ${onClick ? 'cursor-pointer hover:shadow-md hover:border-tip-primary/20' : 'shadow-sm'}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export default InsightCard;
