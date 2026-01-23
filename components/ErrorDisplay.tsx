'use client';

import type { GenerationError } from '@/types';
import { useEffect, useState } from 'react';

interface ErrorDisplayProps {
    error: GenerationError;
    onRetry: () => void;
}

/**
 * ErrorDisplay Component
 * Displays error messages with retry functionality
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
    const [countdown, setCountdown] = useState(error.retryAfter ?? 0);

    // Countdown timer for rate limit errors
    useEffect(() => {
        if (error.code !== 'RATE_LIMIT' || !error.retryAfter) {
            setCountdown(0);
            return;
        }

        setCountdown(error.retryAfter);

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [error.code, error.retryAfter]);

    const isRateLimited = error.code === 'RATE_LIMIT' && countdown > 0;

    const getErrorIcon = () => {
        switch (error.code) {
            case 'RATE_LIMIT':
                return (
                    <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                );
            case 'SERVICE_UNAVAILABLE':
                return (
                    <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M18.36 6.64a9 9 0 11-12.73 0" />
                        <line x1="12" y1="2" x2="12" y2="12" />
                    </svg>
                );
            case 'UNAUTHORIZED':
                return (
                    <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                );
            default:
                return (
                    <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                );
        }
    };

    return (
        <div
            role="alert"
            aria-live="polite"
            className="w-full max-w-md mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/30"
        >
            <div className="flex items-start gap-3">
                <div className="shrink-0 text-red-400">{getErrorIcon()}</div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-400">{error.message}</p>

                    {isRateLimited && (
                        <p className="mt-1 text-sm text-slate-400">
                            Try again in{' '}
                            <span className="font-medium tabular-nums text-slate-300">
                                {countdown}
                            </span>{' '}
                            {countdown === 1 ? 'second' : 'seconds'}
                        </p>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={onRetry}
                disabled={isRateLimited}
                className={`
          mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg
          font-medium text-sm
          transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
          ${isRateLimited
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 active:bg-red-500/40'
                    }
        `}
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
                    <path d="M21 2v6h-6" />
                    <path d="M3 12a9 9 0 0115-6.7L21 8" />
                    <path d="M3 22v-6h6" />
                    <path d="M21 12a9 9 0 01-15 6.7L3 16" />
                </svg>
                <span>{isRateLimited ? `Wait ${countdown}s` : 'Try Again'}</span>
            </button>
        </div>
    );
}

/**
 * Helper function to check if retry is available for an error
 * Used by Property 8: Error Retry Availability
 */
export function isRetryAvailable(_error: GenerationError): boolean {
    // All error types should have retry available
    // Rate limit errors have retry available after countdown
    return true;
}

/**
 * Helper function to check if retry button should be enabled
 */
export function isRetryEnabled(
    errorCode: GenerationError['code'],
    countdown: number,
): boolean {
    if (errorCode === 'RATE_LIMIT' && countdown > 0) {
        return false;
    }
    return true;
}
