# Tailwind CSS Setup and Configuration

## Overview
This project uses Tailwind CSS with PostCSS for styling. The CSS directives `@tailwind` and `@apply` are processed during the build process.

## Configuration Files

### 1. `tailwind.config.js`
- Contains Tailwind CSS configuration
- Defines content paths, theme extensions, and custom colors
- Located in the project root

### 2. `postcss.config.js`
- Configures PostCSS to process Tailwind CSS
- Includes `tailwindcss` and `autoprefixer` plugins

### 3. `.vscode/settings.json`
- VS Code configuration to suppress CSS validation warnings
- Disables CSS validation for unknown at-rules
- Associates `.css` files with Tailwind CSS language mode

### 4. `.vscode/css_custom_data.json`
- Defines custom CSS at-directives for VS Code
- Provides documentation for `@tailwind`, `@apply`, and `@layer` directives

## CSS Directives

### `@tailwind` Directives
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
These directives inject Tailwind's base styles, component classes, and utility classes.

### `@apply` Directives
```css
@apply border-border;
@apply bg-background text-foreground;
```
These directives inline utility classes into custom CSS.

## IDE Warnings

If you see "Unknown at rule" warnings in your IDE:
1. These are just linter warnings, not actual errors
2. The build process works correctly (verified with `npm run build`)
3. The warnings can be safely ignored
4. VS Code configuration files are provided to suppress these warnings

## Build Process

The build process correctly processes all Tailwind directives:
- Development: `npm run dev` (Vite with PostCSS)
- Production: `npm run build` (Vite build with PostCSS processing)

## Troubleshooting

If you encounter issues:
1. Ensure Tailwind CSS is installed: `npm list tailwindcss`
2. Check PostCSS configuration in `postcss.config.js`
3. Verify Tailwind config in `tailwind.config.js`
4. Restart VS Code to apply new settings
5. Run `npm run build` to verify the build process works
