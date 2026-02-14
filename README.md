# AI Isometric Icon Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

Create stunning isometric 3D icons from text prompts using AI. Perfect for designers, developers, and content creators who need quick, consistent isometric graphics without manual design work.

## Features

- **Text-to-Icon Generation**: Describe your icon and let AI create it
- **Style Presets**: Choose from Default (blue), Warm (orange/red), Monochrome (grayscale), or Pastel themes
- **Isometric Post-Processing**: Automatic 30° rotation with depth gradients and shadows
- **Generation History**: Save and redownload your past creations
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Accessible**: WCAG compliant with keyboard navigation and screen reader support

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **AI**: Hugging Face Inference API (primary) + Cloudflare Workers AI (fallback)
- **Testing**: Vitest + fast-check (property-based testing)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Hugging Face API key ([Get one here](https://huggingface.co/settings/tokens))
- Cloudflare Account ID & API Token ([Get one here](https://dash.cloudflare.com/profile/api-tokens)) - for fallback provider

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ryansutrisno/isometricon.git
   cd isometricon
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

4. Add your API keys to `.env.local`:

   ```
   HUGGINGFACE_API_KEY=your_huggingface_api_key_here
   CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
   CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm run dev`        | Start development server |
| `npm run build`      | Build for production     |
| `npm run start`      | Start production server  |
| `npm run lint`       | Run ESLint               |
| `npm run test`       | Run tests once           |
| `npm run test:watch` | Run tests in watch mode  |

## Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── api/             # API routes
│   ├── generate/        # Generator page
│   └── page.tsx         # Landing page
├── components/          # React components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── types/               # TypeScript type definitions
└── __tests__/           # Test files
    ├── unit/           # Unit tests
    ├── properties/     # Property-based tests
    └── integration/    # Integration tests
```

## Design System

| Token      | Value                                                     |
| ---------- | --------------------------------------------------------- |
| Base Color | `#0f172a`                                                 |
| Primary    | `#6366f1` (Indigo)                                        |
| Secondary  | `#8b5cf6` (Violet)                                        |
| Font       | Inter                                                     |
| Spacing    | xs(4px), sm(8px), md(16px), lg(24px), xl(32px), 2xl(48px) |

## Rate Limiting

To protect API quota, the app limits requests to 10 per minute per client.

## Provider Fallback System

The app uses a dual-provider architecture for reliability:

1. **Primary**: Hugging Face Inference API
2. **Fallback**: Cloudflare Workers AI (FLUX.1 schnell model)

When the primary provider fails with recoverable errors (rate limit, timeout, server error), the system automatically falls back to Cloudflare. This ensures higher availability for image generation.

## Credits

Created and maintained by [Ryan Sutrisno](https://github.com/ryansutrisno).

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
