'use client';

interface GenerateButtonProps {
    onClick: () => void;
    isLoading: boolean;
    disabled?: boolean;
    progress?: number;
}

/**
 * GenerateButton Component
 * Button with loading state and progress indicator
 * Requirements: 4.2, 4.3
 */
export function GenerateButton({
    onClick,
    isLoading,
    disabled = false,
    progress = 0,
}: GenerateButtonProps) {
    const isDisabled = disabled || isLoading;

    return (
        <button
            type="submit"
            onClick={onClick}
            disabled={isDisabled}
            aria-busy={isLoading}
            className={`
        relative w-full sm:w-auto px-8 py-3 rounded-lg
        font-medium text-white
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
        disabled:cursor-not-allowed
        ${isDisabled
                    ? 'bg-slate-700 text-slate-400'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700'
                }
      `}
        >
            {/* Progress bar overlay */}
            {isLoading && progress > 0 && (
                <div
                    className="absolute inset-0 bg-indigo-500/30 rounded-lg transition-all duration-300"
                    style={{ width: `${progress}%` }}
                    aria-hidden="true"
                />
            )}

            <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                    <>
                        {/* Spinner */}
                        <svg
                            className="animate-spin h-5 w-5"
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
                        <span>Generating{progress > 0 ? `… ${progress}%` : '…'}</span>
                    </>
                ) : (
                    <>
                        {/* Sparkle icon */}
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
                            <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
                        </svg>
                        <span>Generate Icon</span>
                    </>
                )}
            </span>
        </button>
    );
}
