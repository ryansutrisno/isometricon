import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://isometricon.trazmedia.com';
const ogImage = '/isometric-icon-generator.png';

export const metadata: Metadata = {
    title: 'Generate Icon',
    description:
        'Generate custom isometric 3D icons from text descriptions. Choose from multiple style presets and download high-quality PNG files.',
    alternates: {
        canonical: `${siteUrl}/generate`,
    },
    openGraph: {
        type: 'website',
        url: `${siteUrl}/generate`,
        siteName: 'AI Isometric Icon Generator',
        title: 'Generate Icon | AI Isometric Icon Generator',
        description:
            'Generate custom isometric 3D icons from text descriptions. Choose from multiple style presets.',
        images: [
            {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: 'AI Isometric Icon Generator - Create stunning 3D icons with AI',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Generate Icon | AI Isometric Icon Generator',
        description:
            'Generate custom isometric 3D icons from text descriptions. Choose from multiple style presets.',
        images: [ogImage],
    },
};

export default function GenerateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
