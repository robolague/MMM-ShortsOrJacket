const test = require("node:test");
const assert = require("node:assert/strict");
const {
	isWithinTimeWindow,
	getSeasonalOverride,
	hasPrecipitation,
	getRecommendation
} = require("../recommendation.js");

const baseForecast = {
	maxTemperature: 70,
	weatherType: "day-sunny",
	precipitationAmount: 0,
	precipitationProbability: 0
};

test("isWithinTimeWindow respects morning cutoff at 10", () => {
	assert.equal(isWithinTimeWindow(5, 5, 10), true);
	assert.equal(isWithinTimeWindow(9, 5, 10), true);
	assert.equal(isWithinTimeWindow(10, 5, 10), false);
	assert.equal(isWithinTimeWindow(4, 5, 10), false);
});

test("getRecommendation returns shorts above threshold", () => {
	const result = getRecommendation({
		forecast: baseForecast,
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 7
	});

	assert.equal(result.visible, true);
	assert.equal(result.state, "shorts");
	assert.equal(result.highTemp, 70);
});

test("getRecommendation returns jacket below threshold", () => {
	const result = getRecommendation({
		forecast: { ...baseForecast, maxTemperature: 60 },
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 7
	});

	assert.equal(result.state, "jacket");
});

test("getRecommendation returns jacket at threshold boundary for below", () => {
	const atThreshold = getRecommendation({
		forecast: { ...baseForecast, maxTemperature: 65 },
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 7
	});

	assert.equal(atThreshold.state, "shorts");
});

test("rain and snow override warm forecast to jacket", () => {
	const rainy = getRecommendation({
		forecast: { ...baseForecast, weatherType: "day-rain" },
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 7
	});

	const snowy = getRecommendation({
		forecast: { ...baseForecast, weatherType: "day-snow" },
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 7
	});

	assert.equal(rainy.state, "jacket");
	assert.equal(snowy.state, "jacket");
});

test("hasPrecipitation detects probability threshold", () => {
	assert.equal(hasPrecipitation({ precipitationProbability: 35 }, 30), true);
	assert.equal(hasPrecipitation({ precipitationProbability: 10 }, 30), false);
});

test("seasonal override forces jacket in winter", () => {
	const result = getRecommendation({
		forecast: baseForecast,
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 7,
		now: new Date("2026-01-15T08:00:00"),
		seasonalOverrides: [{ months: [1, 2, 12], recommendation: "jacket" }]
	});

	assert.equal(result.state, "jacket");
});

test("precipitation still overrides seasonal shorts", () => {
	const result = getRecommendation({
		forecast: { ...baseForecast, weatherType: "day-snow" },
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 7,
		now: new Date("2026-07-15T08:00:00"),
		seasonalOverrides: [{ months: [7], recommendation: "shorts" }]
	});

	assert.equal(result.state, "jacket");
});

test("missing forecast returns unavailable message state", () => {
	const result = getRecommendation({
		forecast: null,
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 7
	});

	assert.equal(result.visible, true);
	assert.equal(result.state, "unavailable");
});

test("outside time window hides module", () => {
	const result = getRecommendation({
		forecast: baseForecast,
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 11
	});

	assert.equal(result.visible, false);
});
