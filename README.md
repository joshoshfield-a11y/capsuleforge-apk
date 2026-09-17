# CapsuleForge APK

Android WebView wrapper around CapsuleForge (itch.io marketing asset studio).
100% offline — all rendering in WebView canvas. Exports save to
Pictures/CapsuleForge/ via a native bridge (studio.js feature-detects it;
browser builds are unaffected).

- Source web app: https://github.com/joshoshfield-a11y/capsuleforge
- Built by GitHub Actions (`assembleDebug` + `assembleRelease`, debug-key signed)
