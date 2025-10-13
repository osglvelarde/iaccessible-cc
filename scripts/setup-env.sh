#!/bin/bash

# Setup script for local development environment
echo "Setting up iAccessible Command Center for local development..."

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cat > .env.local << EOF
# Local development environment variables
NEXT_PUBLIC_SCANNER_API_URL=http://localhost:4000
EOF
    echo "✅ Created .env.local"
else
    echo "✅ .env.local already exists"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Install scanner service dependencies
echo "Installing scanner service dependencies..."
cd scanner-service
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start the scanner service: cd scanner-service && npm start"
echo "2. Start the Next.js app: npm run dev"
echo ""
echo "The app will be available at http://localhost:3000"
echo "The scanner service will be available at http://localhost:4000"
