/**
 * Works out someone's age in whole years on a given day.
 *
 * Compares local calendar dates, like formatDate. Because the site is built
 * statically, "today" is the day `astro build` runs, so a new age only appears on
 * the first deploy after the birthday.
 */
export function getAge(birthDate: Date, today: Date): number {
	const years = today.getFullYear() - birthDate.getFullYear();

	// The year difference already counts this year's birthday, so take one off if
	// it hasn't happened yet.
	const hadBirthdayThisYear =
		today.getMonth() > birthDate.getMonth() ||
		(today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

	return hadBirthdayThisYear ? years : years - 1;
}
