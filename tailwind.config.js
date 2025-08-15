export default {
    content: [
        './index.html',
        './src/**/*.{vue,js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#2563eb',
                primaryDark: '#1e40af',
                surface: '#0b1020',
                card: '#111827',
                border: '#1f2937',
                text: '#e5e7eb',
                subtext: '#9ca3af',
                accent: '#10b981'
            },
            boxShadow: {
                soft: '0 8px 24px rgba(0,0,0,0.25)',
            },
            borderRadius: {
                xl: '14px',
            },
        },
    },
    plugins: [],
}
