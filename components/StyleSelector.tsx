'use client';

import { STYLE_CONFIGS, type StylePreset } from '@/types';
import { useId, useRef } from 'react';

const STYLE_OPTIONS: StylePreset[] = ['default', 'warm', 'monochrome', 'pastel'];

interface StyleSelectorProps {
    value: StylePreset;
    onChange: (style: StylePreset) => void;
    disabled?: boolean;
}

/**
 * StyleSelector Component
 * Style preset selector with keyboard navigation
 * Requirements: 3.1, 3.2, 3.3, 3.5
 */
export function StyleSelector({
    value,
    onChange,
    disabled = false,
}: StyleSelectorProps) {
    const groupId = useId();
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
        if (disabled) return;

        let nextIndex: number | null = null;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                nextIndex = (currentIndex + 1) % STYLE_OPTIONS.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                nextIndex =
                    (currentIndex - 1 + STYLE_OPTIONS.length) % STYLE_OPTIONS.length;
                break;
            case 'Home':
                e.preventDefault();
                nextIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                nextIndex = STYLE_OPTIONS.length - 1;
                break;
        }

        if (nextIndex !== null) {
            const nextStyle = STYLE_OPTIONS[nextIndex];
            onChange(nextStyle);
            buttonRefs.current[nextIndex]?.focus();
        }
    };

    return (
        <div className="w-full">
            <span
                id={`${groupId}-label`}
                className="block text-sm font-medium text-slate-200 mb-3"
            >
                Choose a style
            </span>

            <div
                role="radiogroup"
                aria-labelledby={`${groupId}-label`}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
                {STYLE_OPTIONS.map((style, index) => {
                    const config = STYLE_CONFIGS[style];
                    const isSelected = value === style;

                    return (
                        <button
                            key={style}
                            ref={(el) => {
                                buttonRefs.current[index] = el;
                            }}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={isSelected ? 0 : -1}
                            disabled={disabled}
                            onClick={() => onChange(style)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={`
                relative flex flex-col items-center gap-2 p-4 rounded-lg
                border-2 transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isSelected
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                                }
              `}
                        >
                            {/* Color preview */}
                            <div className="flex gap-1">
                                <div
                                    className="w-6 h-6 rounded-full"
                                    style={{ backgroundColor: config.colors[0] }}
                                    aria-hidden="true"
                                />
                                <div
                                    className="w-6 h-6 rounded-full"
                                    style={{ backgroundColor: config.colors[1] }}
                                    aria-hidden="true"
                                />
                            </div>

                            {/* Style name */}
                            <span className="text-sm font-medium text-slate-200">
                                {config.name}
                            </span>

                            {/* Selected indicator */}
                            {isSelected && (
                                <div
                                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500"
                                    aria-hidden="true"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
