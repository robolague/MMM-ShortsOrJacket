const test = require("node:test");
const assert = require("node:assert/strict");
const {
	isWithinTimeWindow,
	getSeasonalOverride,
	hasPrecipitation,
	hasPrecipitationDuringHours,
	getRecommendation
} = require("../recommendation.js");

const baseForecast = {
	maxTemperature: 70,
	minTemperature: 52,
	weatherType: "day-sunny",
	precipitationAmount: 0,
	precipitationProbability: 0
};

const todayMorning = new Date("2026-07-15T08:00:00");

test("isWithinTimeWindow respects morning cutoff at 10", () => {
	assert.equal(isWithinTimeWindow(5, 5, 10), true);
	assert.equal(isWithinTimeWindow(9, 5, 10), true);
	assert.equal(isWithinTimeWindow(10, 5, 10), false);
	assert.equal(isWithinTimeWindow(4, 5, 10), false);
});

test("getRecommendation returns shorts above threshold", () => {
	const result = getRecommendation({
		forecast: { ...baseForecast, minTemperature: 60 },
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

test("getRecommendation returns both for warm day with cool morning", () => {
	const result = getRecommendation({
		forecast: baseForecast,
		threshold: 65,
		layerThreshold: 55,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 7
	});

	assert.equal(result.state, "both");
	assert.equal(result.lowTemp, 52);
});

test("rain and snow on daily forecast override warm day when hourly unavailable", () => {
	const rainy = getRecommendation({
		forecast: { ...baseForecast, weatherType: "day-rain" },
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 7
	});

	assert.equal(rainy.state, "jacket");
});

test("overnight rain does not force jacket when hourly daytime is dry", () => {
	const hourlyArray = [
		{ date: new Date("2026-07-15T08:00:00"), weatherType: "day-sunny", precipitationProbability: 0 },
		{ date: new Date("2026-07-15T12:00:00"), weatherType: "day-sunny", precipitationProbability: 0 },
		{ date: new Date("2026-07-15T22:00:00"), weatherType: "night-rain", precipitationProbability: 80 }
	];

	const result = getRecommendation({
		forecast: { ...baseForecast, weatherType: "day-rain", precipitationProbability: 60 },
		hourlyArray,
		threshold: 65,
		layerThreshold: 55,
		precipFromHour: 7,
		precipUntilHour: 19,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 7,
		now: todayMorning
	});

	assert.equal(result.state, "both");
});

test("daytime rain in hourly forecast forces jacket", () => {
	const hourlyArray = [
		{ date: new Date("2026-07-15T09:00:00"), weatherType: "day-rain", precipitationProbability: 70 }
	];

	const result = getRecommendation({
		forecast: { ...baseForecast, minTemperature: 60 },
		hourlyArray,
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 7,
		now: todayMorning
	});

	assert.equal(result.state, "jacket");
});

test("hasPrecipitationDuringHours ignores hours outside window", () => {
	const hourlyArray = [
		{ date: new Date("2026-07-15T23:00:00"), weatherType: "night-rain", precipitationProbability: 90 }
	];

	assert.equal(hasPrecipitationDuringHours(hourlyArray, todayMorning, 7, 19, 30), false);
});

test("hasPrecipitation detects probability threshold", () => {
	assert.equal(hasPrecipitation({ precipitationProbability: 35 }, 30), true);
	assert.equal(hasPrecipitation({ precipitationProbability: 10 }, 30), false);
});

test("seasonal override forces jacket in winter", () => {
	const result = getRecommendation({
		forecast: { ...baseForecast, minTemperature: 60 },
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10,
		nowHour: 7,
		now: new Date("2026-01-15T08:00:00"),
		seasonalOverrides: [{ months: [1, 2, 12], recommendation: "jacket" }]
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
