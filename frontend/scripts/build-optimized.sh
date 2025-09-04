#!/bin/bash

echo "Building optimized APK for FutureFind..."

# Clean previous builds
cd android
./gradlew clean

# Build for specific architectures
echo "Building for ARM64-v8a..."
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a

echo "Building for ARM-v7a..."
./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a

# Build universal APK (optional, for testing)
echo "Building universal APK..."
./gradlew assembleRelease

echo "Build complete! Check the app/build/outputs/apk/ directory for optimized APKs."
echo "Individual architecture APKs will be smaller than the universal APK."
