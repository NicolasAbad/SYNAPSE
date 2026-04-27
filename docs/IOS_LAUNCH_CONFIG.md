# iOS Launch Configuration

iOS native project (`ios/`) is not yet scaffolded. Run `npx cap add ios` before iOS submission. After scaffolding, the following entries MUST be added to `ios/App/App/Info.plist` before TestFlight upload — otherwise the app crashes on first launch (ATT) or fails App Store review (URL types, privacy declarations).

## Required Info.plist additions

Add these inside the top-level `<dict>` of `ios/App/App/Info.plist`:

```xml
<!-- Pre-launch audit Day 1 — synapse:// deep links for daily-reminder
     notification taps + post-launch share-card return links. Without this
     the URL scheme is rejected by the OS and Capacitor's
     useNativeNavigation deep-link handler never fires. -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>synapse</string>
        </array>
        <key>CFBundleURLName</key>
        <string>com.nicoabad.synapse</string>
    </dict>
</array>

<!-- Pre-launch audit Day 1 — App Tracking Transparency (ATT) is required
     on iOS 14.5+ before any IDFA-using SDK can call ATTrackingManager.
     AdMob + RevenueCat both consume IDFA for personalized ads / attribution.
     WITHOUT THIS KEY, the app CRASHES the first time ATT is requested.
     Copy must be honest about why we're asking — vague copy fails review. -->
<key>NSUserTrackingUsageDescription</key>
<string>SYNAPSE uses your advertising identifier to provide personalized ads and measure their effectiveness. You can opt out at any time in Settings.</string>

<!-- Pre-launch audit Day 1 — push notification user-facing strings.
     Capacitor's @capacitor/push-notifications + @capacitor/local-notifications
     plugins handle the runtime prompt; these descriptions appear in
     Settings → SYNAPSE → Notifications and must be set for App Store
     compliance with privacy nutrition labels. -->
<key>NSUserNotificationsUsageDescription</key>
<string>SYNAPSE sends daily reminders so you can keep your streak, plus alerts when your offline progress is full.</string>
```

## Verification checklist (post-scaffold)

After running `npx cap add ios`:

- [ ] Open `ios/App/App/Info.plist` and add the 3 keys above
- [ ] Open `ios/App/App.xcworkspace` in Xcode (NOT `.xcodeproj`)
- [ ] Set deployment target to iOS 14.0+ (required for Capacitor 6 + ATT)
- [ ] Set bundle identifier to `com.nicoabad.synapse` (already locked)
- [ ] Set provisioning profile + signing certificate
- [ ] In Xcode → Capabilities tab, enable: Push Notifications, Background Modes (Remote notifications)
- [ ] Build to a real iOS device (simulator can't test ATT or push)
- [ ] First-launch test: confirm ATT prompt appears, app does NOT crash
- [ ] Tap a `synapse://mind` deep link from Notes → confirm app opens to Mind tab
- [ ] Submit to TestFlight first; do NOT submit straight to App Store

## Why these can't be added now

The audit recommended editing `ios/App/App/Info.plist` directly, but:
1. The directory doesn't exist (`npx cap add ios` not run)
2. Generating the iOS project requires macOS + Xcode (not available in this dev environment)
3. Editing the file manually before `cap add ios` would be overwritten when the iOS project is generated

This file documents the exact additions for the moment the iOS project is scaffolded, so the changes survive the gap between sessions.

## See also

- [docs/pre-launch-audit-report.md](pre-launch-audit-report.md) §J — production launch readiness findings
- Capacitor iOS deployment guide: https://capacitorjs.com/docs/ios
- Apple ATT documentation: https://developer.apple.com/documentation/apptrackingtransparency
- App Review Guideline 5.1.2 (data privacy): https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage
