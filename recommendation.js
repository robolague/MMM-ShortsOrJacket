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
 * @param {*} dateValue
 * @returns {Date|null}
 */
function parseWeatherDate(dateValue) {
	if (!dateValue) {
		return null;
	}

	if (dateValue instanceof Date) {
		return dateValue;
	}

	if (typeof dateValue === "object" && typeof dateValue.toDate === "function") {
		return dateValue.toDate();
	}

	if (typeof dateValue === "object" && typeof dateValue.hour === "function") {
		const clone = dateValue.clone ? dateValue.clone() : dateValue;
		return new Date(clone.year(), clone.month(), clone.date(), clone.hour(), clone.minute());
	}

	const parsed = new Date(dateValue);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
function isSameCalendarDay(a, b) {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
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
 * @param {object|null|undefined} weatherEntry
 * @param {number} precipProbabilityThreshold
 * @returns {boolean}
 */
function hasPrecipitation(weatherEntry, precipProbabilityThreshold) {
	if (!weatherEntry) {
		return false;
	}

	const weatherType = String(weatherEntry.weatherType || "").toLowerCase();
	if (PRECIP_KEYWORDS.some((keyword) => weatherType.includes(keyword))) {
		return true;
	}

	if (Number(weatherEntry.precipitationAmount) > 0) {
		return true;
	}

	if (Number(weatherEntry.precipitationProbability) >= precipProbabilityThreshold) {
		return true;
	}

	return false;
}

/**
 * Only count rain/snow during hours you are likely to be out (ignores overnight).
 *
 * @param {Array<object>|null|undefined} hourlyArray
 * @param {Date} now
 * @param {number} precipFromHour
 * @param {number} precipUntilHour
 * @param {number} precipProbabilityThreshold
 * @returns {boolean|null} null when hourly data is unavailable (use daily fallback)
 */
function hasPrecipitationDuringHours(hourlyArray, now, precipFromHour, precipUntilHour, precipProbabilityThreshold) {
	if (!Array.isArray(hourlyArray) || hourlyArray.length === 0) {
		return null;
	}

	const todayEntries = hourlyArray.filter((entry) => {
		const entryDate = parseWeatherDate(entry.date);
		return entryDate && isSameCalendarDay(entryDate, now);
	});

	if (todayEntries.length === 0) {
		return null;
	}

	const relevantHours = todayEntries.filter((entry) => {
		const hour = parseWeatherDate(entry.date).getHours();
		return hour >= precipFromHour && hour < precipUntilHour;
	});

	if (relevantHours.length === 0) {
		return false;
	}

	return relevantHours.some((entry) => hasPrecipitation(entry, precipProbabilityThreshold));
}

/**
 * @param {object} options
 * @param {object|null|undefined} options.forecast - Today's forecast entry
 * @param {Array<object>|null|undefined} [options.hourlyArray]
 * @param {number} options.threshold
 * @param {number} [options.layerThreshold]
 * @param {number} options.showFromHour
 * @param {number} options.showUntilHour
 * @param {number} options.precipFromHour
 * @param {number} options.precipUntilHour
 * @param {number} options.nowHour
 * @param {Date} [options.now]
 * @param {Array<{months: number[], recommendation: string}>} [options.seasonalOverrides]
 * @param {number} [options.precipProbabilityThreshold]
 * @returns {{visible: boolean, state: "shorts"|"jacket"|"both"|"unavailable", highTemp: number|null, lowTemp: number|null, reason: string}}
 */
function getRecommendation(options) {
	const {
		forecast,
		hourlyArray,
		threshold,
		layerThreshold = 55,
		showFromHour,
		showUntilHour,
		precipFromHour = 7,
		precipUntilHour = 19,
		nowHour,
		now = new Date(),
		seasonalOverrides = [],
		precipProbabilityThreshold = 30
	} = options;

	if (!isWithinTimeWindow(nowHour, showFromHour, showUntilHour)) {
		return {
			visible: false,
			state: "unavailable",
			highTemp: null,
			lowTemp: null,
			reason: "outside_time_window"
		};
	}

	if (!forecast || forecast.maxTemperature === undefined || forecast.maxTemperature === null) {
		return {
			visible: true,
			state: "unavailable",
			highTemp: null,
			lowTemp: null,
			reason: "no_forecast"
		};
	}

	const highTemp = Number(forecast.maxTemperature);
	const lowTemp =
		forecast.minTemperature === undefined || forecast.minTemperature === null
			? null
			: Number(forecast.minTemperature);

	const hourlyPrecip = hasPrecipitationDuringHours(
		hourlyArray,
		now,
		precipFromHour,
		precipUntilHour,
		precipProbabilityThreshold
	);
	const daytimePrecip =
		hourlyPrecip === null ? hasPrecipitation(forecast, precipProbabilityThreshold) : hourlyPrecip;

	const seasonal = getSeasonalOverride(now, seasonalOverrides);
	let state;

	if (daytimePrecip) {
		state = "jacket";
	} else if (seasonal) {
		state = seasonal;
	} else if (highTemp >= threshold && lowTemp !== null && lowTemp < layerThreshold) {
		state = "both";
	} else if (highTemp >= threshold) {
		state = "shorts";
	} else {
		state = "jacket";
	}

	return {
		visible: true,
		state,
		highTemp,
		lowTemp,
		reason: daytimePrecip ? "daytime_precip" : "forecast"
	};
}

const api = {
	PRECIP_KEYWORDS,
	isWithinTimeWindow,
	parseWeatherDate,
	getSeasonalOverride,
	hasPrecipitation,
	hasPrecipitationDuringHours,
	getRecommendation
};

if (typeof module !== "undefined" && module.exports) {
	module.exports = api;
} else {
	// eslint-disable-next-line no-undef
	window.ShortsOrJacketRecommendation = api;
}
