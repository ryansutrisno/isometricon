'use client';

import { calculateRemaining, enforceCharacterLimit } from '@/lib/input-utils';
import { useId } from 'react';

const MAX_LENGTH = 200;

interface PromptInputProps {
    value: string;
    onChange: (value: string) => void;
    maxLength?: number;
    disabled?: boolean;
    error?: string;
}

/**
 * PromptInput Component
 * Text input for entering generation prompts with character limit
 * Requirements: 2.1, 2.2, 2.3, 2.6, 11.1, 11.3
 */
export function PromptInput({
    value,
    onChange,
    maxLength = MAX_LENGTH,
    disabled = false,
    error,
}: PromptInputProps) {
    const inputId = useId();
    const errorId = useId();
    const counterId = useId();

    const remaining = calculateRemaining(value, maxLength);
    const isNearLimit = remaining <= 20;
    const isAtLimit = remaining === 0;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = enforceCharacterLimit(e.target.value, maxLength);
        onChange(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Allow form submission with Ctrl/Cmd + Enter
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            const form = e.currentTarget.closest('form');
            if (form) {
                form.requestSubmit();
            }
        }
    };

    return (
        <div className="w-full">
            <label
                htmlFor={inputId}
                className="block text-sm font-medium text-slate-200 mb-2"
            >
                Describe your icon
            </label>

            <div className="relative">
                <textarea
                    id={inputId}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    maxLength={maxLength}
                    rows={3}
                    placeholder="e.g., a cute robot holding a coffee cup…"
                    aria-label="Icon description prompt"
                    aria-describedby={`${counterId}${error ? ` ${errorId}` : ''}`}
                    aria-invalid={!!error}
                    spellCheck={false}
                    className={`
            w-full px-4 py-3 rounded-lg
            bg-slate-800/50 border
            text-slate-100 placeholder-slate-500
            resize-none
            transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-slate-700 hover:border-slate-600'}
          `}
                />
            </div>

            <div className="flex justify-between items-center mt-2">
                {error ? (
                    <p
                        id={errorId}
                        role="alert"
                        aria-live="polite"
                        className="text-sm text-red-400"
                    >
                        {error}
                    </p>
                ) : (
                    <span className="text-sm text-slate-500">
                        Press Ctrl+Enter to generate
                    </span>
                )}

                <span
                    id={counterId}
                    className={`text-sm tabular-nums ${isAtLimit
                            ? 'text-red-400'
                            : isNearLimit
                                ? 'text-amber-400'
                                : 'text-slate-500'
                        }`}
                >
                    {remaining} characters remaining
                </span>
            </div>
        </div>
    );
}
