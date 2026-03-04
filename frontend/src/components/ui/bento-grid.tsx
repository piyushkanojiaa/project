import { cn } from '../../lib/utils';
import React from 'react';

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                'grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto',
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                'row-span-1 rounded-2xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-6 bg-slate-950/60 border-2 border-slate-700/50 hover:border-blue-500/50 backdrop-blur-md flex flex-col space-y-4',
                className
            )}
        >
            {header && (
                <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 overflow-hidden">
                    {header}
                </div>
            )}
            <div className="group-hover/bento:translate-x-2 transition duration-200">
                {icon && (
                    <div className="flex items-center justify-start mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                            {icon}
                        </div>
                    </div>
                )}
                <div className="font-bold text-xl text-slate-100 mb-2">
                    {title}
                </div>
                <div className="font-normal text-sm text-slate-400">
                    {description}
                </div>
            </div>
        </div>
    );
};

export default BentoGrid;
