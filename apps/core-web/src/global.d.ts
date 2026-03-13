/**
 * Type declarations for asset imports
 * These declarations allow TypeScript to recognize and type-check
 * imports of CSS files, images, and other assets that are processed
 * by RSBuild at build time.
 */

// CSS Module Declarations
// CSS files can be imported as side-effects
// RSBuild handles the processing and injection of styles
declare module '*.css' {
  const content: void;
  export default content;
}

// Image Module Declarations
// Images are processed by RSBuild and return the URL path as a string
declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

// Font Module Declarations
// Fonts are processed by RSBuild and return the URL path as a string
declare module '*.woff' {
  const content: string;
  export default content;
}

declare module '*.woff2' {
  const content: string;
  export default content;
}

declare module '*.eot' {
  const content: string;
  export default content;
}

declare module '*.ttf' {
  const content: string;
  export default content;
}

declare module '*.otf' {
  const content: string;
  export default content;
}

// Media Module Declarations
// Video and audio files are processed by RSBuild and return the URL path
declare module '*.mp4' {
  const content: string;
  export default content;
}

declare module '*.webm' {
  const content: string;
  export default content;
}

declare module '*.ogg' {
  const content: string;
  export default content;
}

declare module '*.mp3' {
  const content: string;
  export default content;
}

declare module '*.wav' {
  const content: string;
  export default content;
}
