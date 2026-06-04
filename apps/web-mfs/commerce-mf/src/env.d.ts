/// <reference types="@rsbuild/core/types" />

declare module '*.svg' {
  const content: string;
  export default content;
}
