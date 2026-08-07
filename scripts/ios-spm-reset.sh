#!/usr/bin/env bash
# Reset local Swift Package Manager state when Xcode shows stale/corrupt Package.swift errors.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_APP="$ROOT/ios/App"

echo "Verifying plugin Package.swift files..."
node "$ROOT/scripts/verify-ios-plugin-packages.mjs"

echo "Clearing local SPM/Xcode build caches..."
rm -rf "$IOS_APP/CapApp-SPM/.swiftpm" "$IOS_APP/CapApp-SPM/build" "$IOS_APP/build"

echo "Resolving Swift packages..."
xcodebuild -resolvePackageDependencies -project "$IOS_APP/App.xcodeproj" -scheme App

echo "Done. Re-open Xcode and build (Shift+Cmd+K, then Cmd+R)."
