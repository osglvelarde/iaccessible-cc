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

### Option 1: Configure Root Directory in Vercel (Recommended for this repository)

Since the standalone app is in a subdirectory, configure Vercel to use it as the root:

1. **Import the repository**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository: `osglvelarde/iaccessible-cc`
   - Select the branch: `feature/standalone-guidelines-app`

2. **Configure Root Directory**:
   - Go to **Settings** → **General**
   - Under **Root Directory**, set: `standalone-guidelines-app`
   - Save settings

3. **Deploy**:
   - Vercel will automatically detect it's a Next.js app
   - Click **Deploy**

### Option 2: Separate Repository (Best for Independent Deployment)

For completely independent deployment:

1. **Create a new repository**:
   - Create a new GitHub repository
   - Copy **only the contents** of `standalone-guidelines-app/` folder (not the folder itself)
   - Push to the new repository

2. **Deploy on Vercel**:
   - Import the new repository
   - Vercel will automatically detect it's a Next.js app
   - No root directory configuration needed

### Option 3: Vercel CLI

If deploying from the repository root, you'll need to specify the directory:

```bash
cd standalone-guidelines-app
vercel --cwd standalone-guidelines-app
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

