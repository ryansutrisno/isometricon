import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'AI Isometric Icon Generator',
    description:
        'Create stunning isometric 3D icons from text prompts using AI. Perfect for designers, developers, and content creators.',
    openGraph: {
        title: 'AI Isometric Icon Generator',
        description:
            'Create stunning isometric 3D icons from text prompts using AI.',
        type: 'website',
    },
};

export const viewport: Viewport = {
    themeColor: '#0f172a',
    colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
