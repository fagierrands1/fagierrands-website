#!/bin/bash
set -e

echo "=========================================="
echo "Starting build process..."
echo "=========================================="

echo "Node version:"
node --version

echo "NPM version:"
npm --version

echo "=========================================="
echo "Installing dependencies..."
echo "=========================================="
npm install --legacy-peer-deps --verbose

echo "=========================================="
echo "Building application..."
echo "=========================================="
npm run build --verbose

echo "=========================================="
echo "Copying _redirects file..."
echo "=========================================="
cp public/_redirects build/_redirects

echo "=========================================="
echo "Build completed successfully!"
echo "=========================================="
