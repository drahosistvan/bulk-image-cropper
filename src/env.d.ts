export {};

declare global {
    interface Window {
        api: {
            pickFolder: () => Promise<string | null>;
            trimImages: (options: { inputDir: string; mode: 'overwrite' | 'subfolder' }) => Promise<{
                processed: number;
                skipped: number;
                outputDir?: string | null;
                errors: Array<{ file: string; message: string }>;
            }>;
        };
    }
}
