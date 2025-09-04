@echo off
echo Building optimized APK for FutureFind...

REM Clean previous builds
cd android
call gradlew clean

REM Build for specific architectures
echo Building for ARM64-v8a...
call gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a

echo Building for ARM-v7a...
call gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a

REM Build universal APK (optional, for testing)
echo Building universal APK...
call gradlew assembleRelease

echo Build complete! Check the app/build/outputs/apk/ directory for optimized APKs.
echo Individual architecture APKs will be smaller than the universal APK.
pause
