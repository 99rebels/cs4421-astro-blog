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

test('the terminal look, opened from the hidden hatch, survives a reload', async ({ page }) => {
	await page.goto('/');
	// A first visit gets the classic look.
	await expect(page.locator('html')).toHaveAttribute('data-view', 'classic');

	// click() hovers first, which opens the hatch's lid, just as it would for a visitor.
	await page.getByRole('button', { name: 'Switch to terminal look' }).click();
	await page.reload();

	await expect(page.locator('html')).toHaveAttribute('data-view', 'terminal');
	await expect(page.getByRole('button', { name: 'Switch to classic look' })).toBeVisible();
});
