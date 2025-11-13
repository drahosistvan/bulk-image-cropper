declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
    export default component;
}

declare global {
    interface Window {
        api: {
            pickFolder: () => Promise<string | null>;
            trimImages: (options: { inputDir: string; mode: 'overwrite' | 'subfolder'; concurrency?: number; threshold?: number }) => Promise<{
                processed: number;
                skipped: number;
                outputDir?: string | null;
                errors: Array<{ file: string; message: string }>;
            }>;
            onProgress: (cb: (p: { total: number; done: number; currentFile: string | null }) => void) => () => void;
        };
    }
}
