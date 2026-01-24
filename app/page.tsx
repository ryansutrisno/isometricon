'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Download, Palette, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

// Example icons data - images from public/examples folder
const exampleIcons = [
    { id: 1, name: 'Patrick Star', src: '/examples/create-a-cute-patrick-star-icon.png' },
    { id: 2, name: 'Banana', src: '/examples/create-icon-banana.png' },
    { id: 3, name: 'Air Plane', src: '/examples/create-a-cute-airplane.png' },
    { id: 4, name: 'Panda', src: '/examples/create-a-cute-panda.png' },
    { id: 5, name: 'Spongebob', src: '/examples/buat-icon-lucu-spongebob.png' },
    { id: 6, name: 'Donut', src: '/examples/create-a-cute-donut.png' },
];

const features = [
    {
        icon: Sparkles,
        title: 'AI-Powered',
        description: 'Generate unique isometric icons from simple text descriptions',
    },
    {
        icon: Palette,
        title: 'Style Presets',
        description: 'Choose from multiple color themes to match your design',
    },
    {
        icon: Zap,
        title: 'Fast Generation',
        description: 'Get your icons in seconds with our optimized pipeline',
    },
    {
        icon: Download,
        title: 'Easy Download',
        description: 'Download high-quality PNG files ready for your projects',
    },
];

export default function LandingPage() {
    const shouldReduceMotion = useReducedMotion();

    const fadeInUp = shouldReduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5 },
        };

    const staggerContainer = shouldReduceMotion
        ? {}
        : {
            animate: {
                transition: {
                    staggerChildren: 0.1,
                },
            },
        };

    return (
        <main id="main-content" className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="hero-heading">
                {/* Background gradient */}
                <div
                    className="absolute inset-0 -z-10 bg-linear-to-b from-primary/10 via-transparent to-transparent"
                    aria-hidden="true"
                />

                <div className="mx-auto max-w-4xl text-center">
                    <motion.div {...fadeInUp}>
                        <h1 id="hero-heading" className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                            <span className="text-text">AI Isometric</span>{' '}
                            <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                                Icon Generator
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p
                        className="mx-auto mt-6 max-w-2xl text-lg text-text-muted sm:text-xl"
                        {...fadeInUp}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        Create stunning isometric 3D icons from text prompts using AI. Perfect for designers, developers, and content creators.
                    </motion.p>

                    <motion.div
                        className="mt-10"
                        {...fadeInUp}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <Link
                            href="/generate"
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base"
                        >
                            <Sparkles className="h-5 w-5" aria-hidden="true" />
                            Start Generating
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Example Icons Gallery */}
            <section className="px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="gallery-heading">
                <div className="mx-auto max-w-6xl">
                    <h2
                        id="gallery-heading"
                        className="text-center text-2xl font-bold text-text sm:text-3xl"
                    >
                        Example Icons
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-center text-text-muted">
                        See what you can create with our AI-powered generator
                    </p>

                    <motion.div
                        className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
                        {...staggerContainer}
                        initial="initial"
                        animate="animate"
                    >
                        {exampleIcons.map((icon, index) => (
                            <motion.div
                                key={icon.id}
                                className="group relative aspect-square overflow-hidden rounded-xl bg-base-light p-2 transition-colors hover:bg-base-lighter"
                                {...(shouldReduceMotion
                                    ? {}
                                    : {
                                        initial: { opacity: 0, scale: 0.9 },
                                        animate: { opacity: 1, scale: 1 },
                                        transition: { delay: index * 0.1, duration: 0.3 },
                                    })}
                            >
                                {/* Example icon image */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={icon.src}
                                    alt={`${icon.name} isometric icon example`}
                                    width={128}
                                    height={128}
                                    className="h-full w-full object-contain"
                                    loading="lazy"
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="features-heading">
                <div className="mx-auto max-w-6xl">
                    <h2
                        id="features-heading"
                        className="text-center text-2xl font-bold text-text sm:text-3xl"
                    >
                        Why Choose Our Generator?
                    </h2>

                    <motion.div
                        className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
                        {...staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                    >
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={feature.title}
                                    className="rounded-xl bg-base-light p-6 text-center"
                                    {...(shouldReduceMotion
                                        ? {}
                                        : {
                                            initial: { opacity: 0, y: 20 },
                                            animate: { opacity: 1, y: 0 },
                                            transition: { delay: index * 0.1, duration: 0.4 },
                                        })}
                                >
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                        <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-semibold text-text">{feature.title}</h3>
                                    <p className="mt-2 text-sm text-text-muted">{feature.description}</p>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-4 py-20 sm:px-6 lg:px-8">
                <motion.div
                    className="mx-auto max-w-4xl rounded-2xl bg-linear-to-r from-primary/20 to-secondary/20 p-8 text-center sm:p-12"
                    {...(shouldReduceMotion
                        ? {}
                        : {
                            initial: { opacity: 0, scale: 0.95 },
                            whileInView: { opacity: 1, scale: 1 },
                            viewport: { once: true },
                            transition: { duration: 0.5 },
                        })}
                >
                    <h2 className="text-2xl font-bold text-text sm:text-3xl">
                        Ready to Create Amazing Icons?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-text-muted">
                        Start generating professional isometric icons in seconds. No design skills required.
                    </p>
                    <Link
                        href="/generate"
                        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base"
                    >
                        <Sparkles className="h-5 w-5" aria-hidden="true" />
                        Get Started Free
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="border-t border-base-lighter px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl text-center text-sm text-text-dim">
                    <p>© 2025 AI Isometric Icon Generator. All rights reserved.</p>
                </div>
            </footer>
        </main>
    );
}
