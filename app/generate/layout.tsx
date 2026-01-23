import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Generate Icon',
    description:
        'Generate custom isometric 3D icons from text descriptions. Choose from multiple style presets and download high-quality PNG files.',
    openGraph: {
        title: 'Generate Icon | AI Isometric Icon Generator',
        description:
            'Generate custom isometric 3D icons from text descriptions. Choose from multiple style presets.',
    },
};

export default function GenerateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
