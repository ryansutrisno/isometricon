'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import { ErrorDisplay } from '@/components/ErrorDisplay';
import { GenerateButton } from '@/components/GenerateButton';
import { HistoryPanel } from '@/components/HistoryPanel';
import { ImageDisplay } from '@/components/ImageDisplay';
import { PromptInput } from '@/components/PromptInput';
import { StyleSelector } from '@/components/StyleSelector';
import { useGenerator } from '@/hooks/use-generator';
import { useHistory } from '@/hooks/use-history';
import { generateFilename } from '@/lib/filename-generator';
import type { HistoryItem } from '@/types';

/**
 * Generator Page
 * Main page for generating isometric icons
 * Requirements: 2.1, 10.1, 10.2, 10.3
 */
export default function GeneratorPage() {
    const history = useHistory();
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);

    const generator = useGenerator({
        onSuccess: (imageData) => {
            // Add to history when generation succeeds
            history.addItem({
                prompt: generator.state.prompt,
                style: generator.state.style,
                imageData,
            });
        },
    });

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            generator.generate();
        },
        [generator]
    );

    const handleRetry = useCallback(() => {
        generator.generate();
    }, [generator]);

    const handleSelectHistoryItem = useCallback((item: HistoryItem) => {
        setSelectedHistoryItem(item);
    }, []);

    const handleRedownloadHistoryItem = useCallback((item: HistoryItem) => {
        const filename = generateFilename(item.prompt);
        const link = document.createElement('a');
        link.href = item.imageData;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const handleClearHistory = useCallback(() => {
        history.clearHistory();
    }, [history]);

    const handleCloseModal = useCallback(() => {
        setSelectedHistoryItem(null);
    }, []);

    // Determine what image to show
    const displayImage = generator.state.generatedImage;
    const displayAlt = generator.state.prompt || 'Generated isometric icon';

    return (
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <header className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base rounded"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Home
                    </Link>
                    <h1 className="mt-4 text-2xl font-bold text-text sm:text-3xl">
                        Generate Isometric Icon
                    </h1>
                    <p className="mt-2 text-text-muted">
                        Describe your icon and choose a style to generate
                    </p>
                </header>

                {/* Main content - responsive grid */}
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Left column - Form */}
                    <div className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <PromptInput
                                value={generator.state.prompt}
                                onChange={generator.setPrompt}
                                disabled={generator.state.isGenerating}
                                error={
                                    generator.state.error?.code === 'VALIDATION_ERROR'
                                        ? generator.state.error.message
                                        : undefined
                                }
                            />

                            <StyleSelector
                                value={generator.state.style}
                                onChange={generator.setStyle}
                                disabled={generator.state.isGenerating}
                            />

                            <GenerateButton
                                onClick={() => { }} // Form handles submit
                                isLoading={generator.state.isGenerating}
                                disabled={!generator.state.prompt.trim()}
                                progress={generator.state.progress}
                            />
                        </form>

                        {/* Error display */}
                        {generator.state.error && generator.state.error.code !== 'VALIDATION_ERROR' && (
                            <ErrorDisplay error={generator.state.error} onRetry={handleRetry} />
                        )}
                    </div>

                    {/* Right column - Image display */}
                    <div className="flex flex-col items-center">
                        <ImageDisplay
                            src={displayImage}
                            alt={displayAlt}
                            isLoading={generator.state.isGenerating}
                            onDownload={generator.download}
                            onRegenerate={generator.regenerate}
                        />
                    </div>
                </div>

                {/* History section */}
                <section className="mt-12" aria-labelledby="history-heading">
                    <h2 id="history-heading" className="sr-only">
                        Generation History
                    </h2>
                    <HistoryPanel
                        items={history.items}
                        onSelect={handleSelectHistoryItem}
                        onRedownload={handleRedownloadHistoryItem}
                        onClear={handleClearHistory}
                    />
                </section>
            </div>

            {/* History item modal */}
            {selectedHistoryItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={handleCloseModal}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') handleCloseModal();
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div
                        className="relative max-w-2xl w-full bg-base-light rounded-xl p-4 sm:p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 p-2 rounded-lg text-text-muted hover:text-text hover:bg-base-lighter transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label="Close modal"
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
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <h3 id="modal-title" className="text-lg font-semibold text-text mb-4">
                            {selectedHistoryItem.prompt}
                        </h3>

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={selectedHistoryItem.imageData}
                            alt={selectedHistoryItem.prompt}
                            width={512}
                            height={512}
                            className="w-full rounded-lg"
                        />

                        <div className="mt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={() => handleRedownloadHistoryItem(selectedHistoryItem)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-light"
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
                                Download
                            </button>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="px-4 py-2.5 rounded-lg bg-base-lighter hover:bg-base-light text-text-muted font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-light"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
