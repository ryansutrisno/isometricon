import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://isometric-icon-generator.vercel.app';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'AI Isometric Icon Generator',
        template: '%s | AI Isometric Icon Generator',
    },
    description:
        'Create stunning isometric 3D icons from text prompts using AI. Perfect for designers, developers, and content creators.',
    keywords: [
        'isometric icons',
        'AI icon generator',
        '3D icons',
        'icon design',
        'AI art',
        'text to image',
        'icon maker',
    ],
    authors: [{ name: 'AI Isometric Icon Generator' }],
    creator: 'AI Isometric Icon Generator',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: siteUrl,
        siteName: 'AI Isometric Icon Generator',
        title: 'AI Isometric Icon Generator',
        description:
            'Create stunning isometric 3D icons from text prompts using AI. Perfect for designers, developers, and content creators.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'AI Isometric Icon Generator - Create stunning 3D icons with AI',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AI Isometric Icon Generator',
        description:
            'Create stunning isometric 3D icons from text prompts using AI.',
        images: ['/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export const viewport: Viewport = {
    themeColor: '#0f172a',
    colorScheme: 'dark',
    width: 'device-width',
    initialScale: 1,
};

// JSON-LD structured data
const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AI Isometric Icon Generator',
    description:
        'Create stunning isometric 3D icons from text prompts using AI. Perfect for designers, developers, and content creators.',
    url: siteUrl,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
    },
    featureList: [
        'AI-powered icon generation',
        'Multiple style presets',
        'Isometric 3D transformation',
        'PNG download',
        'Generation history',
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body>
                {/* Skip link for keyboard navigation - Requirements 11.2 */}
                <a href="#main-content" className="skip-link">
                    Skip to main content
                </a>
                {children}
            </body>
        </html>
    );
}
