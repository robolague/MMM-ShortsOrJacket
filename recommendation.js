/* global module */

const PRECIP_KEYWORDS = [
	"rain",
	"snow",
	"sleet",
	"drizzle",
	"shower",
	"hail",
	"flurr",
	"precipitation",
	"thunder"
];

/**
 * @param {number} hour - 0-23
 * @param {number} showFromHour
 * @param {number} showUntilHour
 * @returns {boolean}
 */
function isWithinTimeWindow(hour, showFromHour, showUntilHour) {
	return hour >= showFromHour && hour < showUntilHour;
}

/**
 * @param {Date} date
 * @param {Array<{months: number[], recommendation: string}>} seasonalOverrides
 * @returns {"shorts"|"jacket"|null}
 */
function getSeasonalOverride(date, seasonalOverrides) {
	if (!Array.isArray(seasonalOverrides) || seasonalOverrides.length === 0) {
		return null;
	}

	const month = date.getMonth() + 1;

	for (const rule of seasonalOverrides) {
		if (!rule || !Array.isArray(rule.months)) {
			continue;
		}

		if (rule.months.includes(month)) {
			return rule.recommendation === "shorts" ? "shorts" : "jacket";
		}
	}

	return null;
}

/**
 * @param {object|null|undefined} forecast
 * @param {number} precipProbabilityThreshold
 * @returns {boolean}
 */
function hasPrecipitation(forecast, precipProbabilityThreshold) {
	if (!forecast) {
		return false;
	}

	const weatherType = String(forecast.weatherType || "").toLowerCase();
	if (PRECIP_KEYWORDS.some((keyword) => weatherType.includes(keyword))) {
		return true;
	}

	if (Number(forecast.precipitationAmount) > 0) {
		return true;
	}

	if (Number(forecast.precipitationProbability) >= precipProbabilityThreshold) {
		return true;
	}

	return false;
}

/**
 * @param {object} options
 * @param {object|null|undefined} options.forecast - Today's forecast entry
 * @param {number} options.threshold
 * @param {number} options.showFromHour
 * @param {number} options.showUntilHour
 * @param {number} options.nowHour
 * @param {Date} [options.now]
 * @param {Array<{months: number[], recommendation: string}>} [options.seasonalOverrides]
 * @param {number} [options.precipProbabilityThreshold]
 * @returns {{visible: boolean, state: "shorts"|"jacket"|"unavailable", highTemp: number|null, reason: string}}
 */
function getRecommendation(options) {
	const {
		forecast,
		threshold,
		showFromHour,
		showUntilHour,
		nowHour,
		now = new Date(),
		seasonalOverrides = [],
		precipProbabilityThreshold = 30
	} = options;

	if (!isWithinTimeWindow(nowHour, showFromHour, showUntilHour)) {
		return { visible: false, state: "unavailable", highTemp: null, reason: "outside_time_window" };
	}

	if (!forecast || forecast.maxTemperature === undefined || forecast.maxTemperature === null) {
		return { visible: true, state: "unavailable", highTemp: null, reason: "no_forecast" };
	}

	const highTemp = Number(forecast.maxTemperature);
	const seasonal = getSeasonalOverride(now, seasonalOverrides);
	let state;

	if (hasPrecipitation(forecast, precipProbabilityThreshold)) {
		state = "jacket";
	} else if (seasonal) {
		state = seasonal;
	} else if (highTemp >= threshold) {
		state = "shorts";
	} else {
		state = "jacket";
	}

	return { visible: true, state, highTemp, reason: "forecast" };
}

const api = {
	PRECIP_KEYWORDS,
	isWithinTimeWindow,
	getSeasonalOverride,
	hasPrecipitation,
	getRecommendation
};

if (typeof module !== "undefined" && module.exports) {
	module.exports = api;
} else {
	// eslint-disable-next-line no-undef
	window.ShortsOrJacketRecommendation = api;
}
