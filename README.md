www.markuswalker.com

## Mobile WebGL Optimisation Notes

This site now builds a capability-based graphics profile before Three.js renderer creation. The profile checks WebGL support, core GPU limits, compressed texture extensions, viewport size, touch/coarse pointer behaviour, reduced motion, and mobile Safari risk. It selects `desktop`, `mobileHigh`, `mobileMedium`, `mobileLow`, or `fallback`, then uses that tier to cap DPR, antialiasing, shadows, particle count, generated canvas texture sizes, animation intensity, and frame pacing.

Mobile Safari stability changes include visualViewport-aware resize handling, requestAnimationFrame-throttled resize updates, adaptive DPR reduction when sustained frame time is over budget, lower-cost CSS effects for mobile quality tiers, pointer capture/cancel handling, reduced mobile hover raycasting, and a guarded context-loss soft reload. If WebGL cannot initialise, the fallback state exposes contact, LinkedIn, GitHub, TryHackMe, and writeup links as regular HTML.

To test iPhone Safari, open the deployed static site on device and rotate through portrait and landscape. Verify the top bar and dock remain tappable, scrolling still advances the scene, dragging the canvas does not open a monitor, reduced motion disables decorative movement, and the fallback links work when WebGL is disabled or context creation fails.
