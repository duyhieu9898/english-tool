import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['backend/__tests__/**/*.test.js', 'src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.storybook'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'backend/__tests__/',
        '*.config.js',
        '.storybook/',
      ],
    },
  },
});
