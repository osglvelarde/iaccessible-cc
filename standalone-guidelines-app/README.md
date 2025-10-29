# Standalone Guidelines & Resources App

A standalone Next.js application for accessing accessibility guidelines and resources, independent of the main Command Center application.

## Features

- **WCAG 2.2 Guidelines**: Complete success criteria with remediation guidelines
- **PDF/UA Compliance**: PDF accessibility validation rules
- **WAVE Tool Reference**: WebAIM WAVE evaluation categories
- **Readability Metrics**: Plain language guidelines
- **Global Search**: Search across all guidelines and resources
- **AI Assistant Integration**: Link to accessibility chatbot for support

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Navigate to the standalone app directory:
```bash
cd standalone-guidelines-app
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
npm start
```

## Deploying to Vercel

This app is ready to deploy independently on Vercel:

1. **Push to a separate repository** (recommended):
   - Create a new GitHub repository
   - Copy the `standalone-guidelines-app` folder contents to the new repo
   - Push to GitHub

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set the root directory to `.` (root of the standalone app)
   - Vercel will automatically detect it's a Next.js app
   - Deploy!

3. **Or use Vercel CLI**:
   ```bash
   cd standalone-guidelines-app
   vercel
   ```

## Project Structure

```
standalone-guidelines-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout (no Header/NavigationBar)
│   │   ├── page.tsx         # Main guidelines page
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── glossary/        # Glossary components
│   │   └── ui/              # UI components (badge, button, card, etc.)
│   └── lib/
│       ├── types/           # TypeScript types
│       ├── glossary-data.ts # All guidelines data
│       ├── wcag-complete.ts # WCAG criteria data
│       └── utils.ts         # Utility functions
├── public/                  # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## Key Differences from Command Center

- ✅ No authentication/user management
- ✅ No header or navigation menu
- ✅ No command center dependencies
- ✅ Self-contained with all necessary data
- ✅ Can be deployed independently

## Dependencies

This app uses:
- **Next.js 15** for the React framework
- **Tailwind CSS 4** for styling
- **Radix UI** for accessible UI components
- **React Markdown** for rendering guidelines content
- **React Syntax Highlighter** for code examples

## Environment Variables

No environment variables are required for basic functionality.

## License

Same as the parent project.

