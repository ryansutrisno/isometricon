'use client';

import type { HistoryItem } from '@/types';
import { STYLE_CONFIGS } from '@/types';

interface HistoryPanelProps {
    items: HistoryItem[];
    onSelect: (item: HistoryItem) => void;
    onRedownload: (item: HistoryItem) => void;
    onClear: () => void;
}

/**
 * HistoryPanel Component
 * Displays past generations with thumbnails and actions
 * Requirements: 9.2, 9.3, 9.4, 9.5
 */
export function HistoryPanel({
    items,
    onSelect,
    onRedownload,
    onClear,
}: HistoryPanelProps) {
    if (items.length === 0) {
        return (
            <div className="w-full p-6 rounded-xl bg-slate-800/30 border border-dashed border-slate-700">
                <div className="flex flex-col items-center gap-2 text-slate-500 text-center">
                    <svg
                        className="h-8 w-8"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <p className="text-sm">No history yet</p>
                    <p className="text-xs text-slate-600">
                        Generated icons will appear here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-slate-200">
                    History ({items.length})
                </h2>
                <button
                    type="button"
                    onClick={onClear}
                    className="
            text-xs text-slate-500 hover:text-red-400
            transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
            rounded px-2 py-1
          "
                    aria-label="Clear all history"
                >
                    Clear all
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {items.map((item) => (
                    <HistoryCard
                        key={item.id}
                        item={item}
                        onSelect={onSelect}
                        onRedownload={onRedownload}
                    />
                ))}
            </div>
        </div>
    );
}

interface HistoryCardProps {
    item: HistoryItem;
    onSelect: (item: HistoryItem) => void;
    onRedownload: (item: HistoryItem) => void;
}

function HistoryCard({ item, onSelect, onRedownload }: HistoryCardProps) {
    const styleConfig = STYLE_CONFIGS[item.style];
    const formattedDate = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(item.createdAt);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item);
        }
    };

    return (
        <div className="group relative rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors duration-200">
            {/* Thumbnail - clickable to view full size */}
            <button
                type="button"
                onClick={() => onSelect(item)}
                onKeyDown={handleKeyDown}
                className="
          w-full aspect-square cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500
        "
                aria-label={`View ${item.prompt}`}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={item.imageData}
                    alt={item.prompt}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </button>

            {/* Info overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 to-transparent p-2">
                <p className="text-xs text-slate-300 truncate" title={item.prompt}>
                    {item.prompt}
                </p>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-500">{formattedDate}</span>
                    <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                            backgroundColor: `${styleConfig.colors[0]}20`,
                            color: styleConfig.colors[0],
                        }}
                    >
                        {styleConfig.name}
                    </span>
                </div>
            </div>

            {/* Redownload button - visible on hover */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRedownload(item);
                }}
                className="
          absolute top-2 right-2
          p-1.5 rounded-md
          bg-slate-900/80 text-slate-300
          opacity-0 group-hover:opacity-100
          hover:bg-slate-800 hover:text-white
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:opacity-100
        "
                aria-label={`Download ${item.prompt}`}
            >
                <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
            </button>
        </div>
    );
}
