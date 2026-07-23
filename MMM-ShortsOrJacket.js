/* global Module, Log, ShortsOrJacketRecommendation */

Module.register("MMM-ShortsOrJacket", {
	defaults: {
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10,
		shortsMessage: "dude, wear shorts!",
		jacketMessage: "dude, get a jacket.",
		unavailableMessage: "dude, look outside",
		shortsEmoji: "🩳",
		jacketEmoji: "🧥",
		precipProbabilityThreshold: 30,
		seasonalOverrides: [],
		updateInterval: 60 * 1000,
		animate: true
	},

	start() {
		Log.info(`Starting module: ${this.name}`);
		this.forecast = null;
		this.recommendation = { visible: false, state: "unavailable", highTemp: null, reason: "no_forecast" };
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
		emoji.textContent = this.recommendation.state === "shorts" ? this.config.shortsEmoji : this.config.jacketEmoji;

		const message = document.createElement("div");
		message.className = "shorts-or-jacket__message";
		message.textContent = this.recommendation.state === "shorts" ? this.config.shortsMessage : this.config.jacketMessage;

		const temperature = document.createElement("div");
		temperature.className = "shorts-or-jacket__temperature";
		temperature.textContent = `High: ${Math.round(this.recommendation.highTemp)}°F`;

		wrapper.appendChild(emoji);
		wrapper.appendChild(message);
		wrapper.appendChild(temperature);

		return wrapper;
	},

	notificationReceived(notification, payload) {
		if (notification === "WEATHER_UPDATED") {
			this.forecast = payload?.forecastArray?.[0] ?? null;
			this.updateDom(this.config.animate ? 300 : 0);
		}
	},

	scheduleTimeWindowCheck() {
		this.refreshRecommendation();
		this.updateDom(this.config.animate ? 300 : 0);

		setInterval(() => {
			const previousVisible = this.recommendation.visible;
			this.refreshRecommendation();

			if (previousVisible !== this.recommendation.visible) {
				this.updateDom(this.config.animate ? 300 : 0);
			}
		}, this.config.updateInterval);
	},

	refreshRecommendation() {
		const now = new Date();
		this.recommendation = ShortsOrJacketRecommendation.getRecommendation({
			forecast: this.forecast,
			threshold: this.config.threshold,
			showFromHour: this.config.showFromHour,
			showUntilHour: this.config.showUntilHour,
			nowHour: now.getHours(),
			now,
			seasonalOverrides: this.config.seasonalOverrides,
			precipProbabilityThreshold: this.config.precipProbabilityThreshold
		});
	}
});
