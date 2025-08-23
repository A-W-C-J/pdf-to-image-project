declare module 'gif.js' {
  interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    background?: string;
    transparent?: string;
    dither?: boolean;
    debug?: boolean;
  }

  interface GIFFrame {
    delay?: number;
    copy?: boolean;
  }

  class GIF {
    constructor(options?: GIFOptions);
    addFrame(element: HTMLCanvasElement | HTMLImageElement, options?: GIFFrame): void;
    on(event: string, callback: (data?: any) => void): void;
    render(): void;
  }

  export = GIF;
}
