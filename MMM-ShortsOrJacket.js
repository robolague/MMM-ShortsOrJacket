/* global Module, Log, ShortsOrJacketRecommendation */

Module.register("MMM-ShortsOrJacket", {
	defaults: {
		threshold: 65,
		layerThreshold: 55,
		showFromHour: 5,
		showUntilHour: 10,
		precipFromHour: 7,
		precipUntilHour: 19,
		shortsMessage: "dude, wear shorts!",
		jacketMessage: "dude, get a jacket.",
		bothMessage: "dude, wear shorts and grab a jacket!",
		unavailableMessage: "dude, look outside",
		shortsEmoji: "🩳",
		jacketEmoji: "🧥",
		bothEmoji: "🩳🧥",
		precipProbabilityThreshold: 30,
		seasonalOverrides: [],
		updateInterval: 60 * 1000,
		animate: true
	},

	start() {
		Log.info(`Starting module: ${this.name}`);
		this.forecast = null;
		this.hourlyArray = [];
		this.recommendation = {
			visible: false,
			state: "unavailable",
			highTemp: null,
			lowTemp: null,
			reason: "no_forecast"
		};
		this.scheduleTimeWindowCheck();
	},

	getScripts() {
		return [`${this.data.path}/recommendation.js`];
	},

	getStyles() {
		return [`${this.data.path}/MMM-ShortsOrJacket.css`];
	},

	getDom() {
		this.refreshRecommendation();

		if (!this.recommendation.visible) {
			return document.createElement("div");
		}

		const wrapper = document.createElement("div");
		wrapper.className = "shorts-or-jacket";

		if (this.recommendation.state === "unavailable") {
			const message = document.createElement("div");
			message.className = "shorts-or-jacket__message";
			message.textContent = this.config.unavailableMessage;
			wrapper.appendChild(message);
			return wrapper;
		}

		const emoji = document.createElement("div");
		emoji.className = "shorts-or-jacket__emoji";
		if (this.recommendation.state === "shorts") {
			emoji.textContent = this.config.shortsEmoji;
		} else if (this.recommendation.state === "both") {
			emoji.textContent = this.config.bothEmoji;
		} else {
			emoji.textContent = this.config.jacketEmoji;
		}

		const message = document.createElement("div");
		message.className = "shorts-or-jacket__message";
		if (this.recommendation.state === "shorts") {
			message.textContent = this.config.shortsMessage;
		} else if (this.recommendation.state === "both") {
			message.textContent = this.config.bothMessage;
		} else {
			message.textContent = this.config.jacketMessage;
		}

		const temperature = document.createElement("div");
		temperature.className = "shorts-or-jacket__temperature";
		const high = Math.round(this.recommendation.highTemp);
		if (this.recommendation.lowTemp !== null && this.recommendation.state === "both") {
			temperature.textContent = `High: ${high}°F · Low: ${Math.round(this.recommendation.lowTemp)}°F`;
		} else {
			temperature.textContent = `High: ${high}°F`;
		}

		wrapper.appendChild(emoji);
		wrapper.appendChild(message);
		wrapper.appendChild(temperature);

		return wrapper;
	},

	notificationReceived(notification, payload) {
		if (notification === "WEATHER_UPDATED") {
			this.forecast = payload?.forecastArray?.[0] ?? null;
			this.hourlyArray = payload?.hourlyArray ?? [];
			this.updateDom(this.config.animate ? 300 : 0);
		}
	},

	scheduleTimeWindowCheck() {
		this.refreshRecommendation();
		this.updateDom(this.config.animate ? 300 : 0);

		setInterval(() => {
			const previousVisible = this.recommendation.visible;
			const previousState = this.recommendation.state;
			this.refreshRecommendation();

			if (previousVisible !== this.recommendation.visible || previousState !== this.recommendation.state) {
				this.updateDom(this.config.animate ? 300 : 0);
			}
		}, this.config.updateInterval);
	},

	refreshRecommendation() {
		const now = new Date();
		this.recommendation = ShortsOrJacketRecommendation.getRecommendation({
			forecast: this.forecast,
			hourlyArray: this.hourlyArray,
			threshold: this.config.threshold,
			layerThreshold: this.config.layerThreshold,
			showFromHour: this.config.showFromHour,
			showUntilHour: this.config.showUntilHour,
			precipFromHour: this.config.precipFromHour,
			precipUntilHour: this.config.precipUntilHour,
			nowHour: now.getHours(),
			now,
			seasonalOverrides: this.config.seasonalOverrides,
			precipProbabilityThreshold: this.config.precipProbabilityThreshold
		});
	}
});
