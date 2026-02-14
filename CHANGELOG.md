# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-01-29

### Added

#### Core Features
- AI-powered text-to-icon generation using multiple providers
- Multi-provider fallback system with Hugging Face (primary) and Cloudflare Workers AI (fallback)
- FLUX.1 schnell model integration for high-quality image generation
- Canvas-based isometric transformation with 30° rotation
- Depth gradient overlay and shadow effects for 3D appearance
- Four style presets: Default (blue/indigo), Warm (orange/red), Monochrome (grayscale), Pastel (soft colors)

#### User Interface
- Landing page with hero section, feature showcase, and example gallery
- Generator page with form input, style selector, and image preview
- History panel with localStorage persistence (max 5 items)
- Responsive design optimized for mobile, tablet, and desktop
- Framer Motion animations with reduced motion support
- Loading states and progress indicators

#### Accessibility (WCAG 2.1 Compliant)
- Full keyboard navigation support
- Screen reader compatibility with ARIA live regions
- Focus management and trap in modals
- Skip links for main content
- Proper heading hierarchy and semantic HTML

#### Security & Input Handling
- Input sanitization to prevent XSS attacks
- Character limit enforcement (200 characters)
- Empty input validation
- Both client-side and server-side rate limiting (5 requests per day per user)

#### Performance
- Next.js 15 with App Router
- Server-side rendering for SEO
- Optimized image loading
- Property-based testing for reliability

#### Testing Infrastructure
- Comprehensive test suite with Vitest
- 20+ property-based tests using fast-check
- Provider manager tests with fallback scenarios
- Rate limiter validation tests
- Error handling and classification tests

#### Developer Experience
- TypeScript with strict mode
- ESLint configuration
- Conventional Commits standard
- Comprehensive documentation (README, CONTRIBUTING, CODE_OF_CONDUCT)
- MIT License

### Security
- Implemented input sanitization to prevent XSS vulnerabilities
- Added rate limiting to protect API quotas
- Secure environment variable handling for API keys

[Unreleased]: https://github.com/ryansutrisno/isometricon/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ryansutrisno/isometricon/releases/tag/v1.0.0
