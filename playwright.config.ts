import { defineConfig, devices } from '@playwright/test';

// The tests run against an app that's already running (`docker compose up`), not one
// Playwright starts itself, so they exercise the real container image.
export default defineConfig({
	testDir: './e2e',
	use: {
		baseURL: process.env.BASE_URL ?? 'http://localhost:4321',
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
