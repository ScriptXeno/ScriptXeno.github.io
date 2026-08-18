/**
 * Site's actual thumbnails today are inconsistent — a beige stock-photo banner, a navy
 * 3D-render poster, a neon cyberpunk graphic all coexist across published posts, with no
 * shared visual identity. This spec is grounded in the site's real (and consistent) brand
 * assets instead: assets/logo/logo.png and assets/preview/ScriptXeno-Social-Preview-Image.png
 * (a stark black-and-white "SX" monogram, bold geometric type, pure black background), plus
 * the actual accent color used throughout the site's UI (_sass/themes/_dark.scss
 * --link-color / --toc-highlight, rgb(138, 180, 248)). One fixed style, applied to every
 * generated thumbnail, is what actually produces a consistent set over time — relying on
 * whoever/whatever writes the prompt to remember the brand each time does not.
 */
export const THUMBNAIL_HOUSE_STYLE = `HOUSE STYLE — apply exactly, every time, no deviation:
- 16:9 landscape blog-thumbnail composition. Generous margins, no clutter, no watermark, no fake UI chrome.
- Background: near-black (#1B1B1E), flat or with an extremely subtle low-opacity abstract geometric/circuit-line texture — quiet, never busy, never competing with the headline.
- Exactly one accent color: sky-blue (#8AB4F8), used only for the headline text and 1-2 key highlights in the supporting graphic. Everything else stays strictly black, white, or light gray. No other colors, no gradients, no neon glow, no rainbow palette.
- Headline typography: bold, uppercase, geometric sans-serif, heavy weight, tight letter-spacing, confident and angular rather than soft or rounded — in the spirit of a sharp-edged wordmark, not a friendly display font.
- Supporting graphic: flat vector / line-art iconography or minimal geometric illustration of the subject. Explicitly NOT a photograph, NOT a photorealistic render, NOT a stock-photo-style image of a person, NOT a busy 3D scene, NOT neon/cyberpunk glow effects.
- Mood: confident, minimal, premium editorial-tech aesthetic — quiet authority, not loud or gimmicky.
- Leave the bottom-right corner visually quiet (no text or dense detail there) — that space is reserved for a small logo mark to be placed afterward.`;

export const ACCENT_COLOR_HEX = "#8AB4F8";
export const BACKGROUND_COLOR_HEX = "#1B1B1E";
