'use client';

interface ImageDisplayProps {
    src: string | null;
    alt: string;
    isLoading: boolean;
    onDownload: () => void;
    onRegenerate: () => void;
}

/**
 * ImageDisplay Component
 * Displays generated image with download and regenerate actions
 * Requirements: 4.4, 6.1, 6.2, 4.7
 */
export function ImageDisplay({
    src,
    alt,
    isLoading,
    onDownload,
    onRegenerate,
}: ImageDisplayProps) {
    // Loading skeleton
    if (isLoading) {
        return (
            <div className="w-full aspect-square max-w-md mx-auto">
                <div
                    className="w-full h-full rounded-xl bg-slate-800/50 border border-slate-700 animate-pulse flex items-center justify-center"
                    role="status"
                    aria-label="Generating image…"
                >
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                        <svg
                            className="animate-spin h-8 w-8"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span className="text-sm">Creating your icon…</span>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state
    if (!src) {
        return (
            <div className="w-full aspect-square max-w-md mx-auto">
                <div className="w-full h-full rounded-xl bg-slate-800/30 border border-dashed border-slate-700 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500 p-6 text-center">
                        <svg
                            className="h-12 w-12"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span className="text-sm">
                            Your generated icon will appear here
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Image display with actions
    return (
        <div className="w-full max-w-md mx-auto">
            <div className="relative rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt}
                    width={512}
                    height={512}
                    className="w-full h-auto"
                />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
                <button
                    type="button"
                    onClick={onDownload}
                    className="
            flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
            bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
            text-white font-medium
            transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
          "
                    aria-label="Download generated icon"
                >
                    <svg
                        className="h-5 w-5"
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
                    <span>Download</span>
                </button>

                <button
                    type="button"
                    onClick={onRegenerate}
                    className="
            flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
            bg-slate-700 hover:bg-slate-600 active:bg-slate-800
            text-slate-200 font-medium
            transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
          "
                    aria-label="Regenerate icon with same prompt"
                >
                    <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M21 2v6h-6" />
                        <path d="M3 12a9 9 0 0115-6.7L21 8" />
                        <path d="M3 22v-6h6" />
                        <path d="M21 12a9 9 0 01-15 6.7L3 16" />
                    </svg>
                    <span>Regenerate</span>
                </button>
            </div>
        </div>
    );
}
