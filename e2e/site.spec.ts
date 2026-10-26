import { expect, test } from '@playwright/test';

test('a visitor can get from the homepage to a post', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'latest posts' }).click();

	// Whichever post is listed first, opening it should show that post's title.
	const firstPost = page.getByRole('main').getByRole('link').first();
	const title = await firstPost.getByRole('heading').innerText();
	await firstPost.click();

	await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
});

test.describe('theme', () => {
	// Pin the system preference, so the test knows which theme the page starts in.
	test.use({ colorScheme: 'light' });

	test('the chosen theme survives a reload', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		await page.getByRole('button', { name: 'Switch to dark theme' }).click();
		await page.reload();

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});
});
