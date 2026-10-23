# MMM-ShortsOrJacket

MagicMirror² module that tells your kid what to wear based on today's forecast high.

- Above the threshold → **"dude, wear shorts!"** 🩳
- Below the threshold → **"dude, get a jacket."** 🧥
- Warm day but cool morning → **"dude, wear shorts and grab a jacket!"** 🩳🧥
- Rain or snow during **daytime hours** (default 7:00–19:00) overrides to jacket — overnight rain is ignored when hourly data is available
- Shows only in the morning (default 5:00–10:00)
- No weather data → **"dude, look outside"**

See [SPEC.md](SPEC.md) for the full specification.

## Prerequisites

- [MagicMirror²](https://docs.magicmirror.builders/) (latest)
- Built-in `weather` module configured with **forecast/daily** data
- Set weather `units` to `"imperial"` so temperatures arrive in °F
- For smarter rain timing, enable **hourly** forecast on your weather provider (e.g. Open-Meteo, OpenWeatherMap One Call)

## Installation

### Option A: Manual clone

```bash
cd ~/MagicMirror/modules
git clone https://github.com/robolague/MM-ShortsOrJacket.git MMM-ShortsOrJacket
```

### Option B: MMM-Installer

```bash
bash -c "$(curl -sL https://raw.githubusercontent.com/KoljaL/MMM-Installer/main/installer.sh)"
```

Search for `MMM-ShortsOrJacket` or install by URL:

```
https://github.com/robolague/MM-ShortsOrJacket
```

## Configuration

Add to `config/config.js`:

```javascript
{
	module: "weather",
	position: "top_right",
	config: {
		weatherProvider: "openweathermap",
		type: "forecast",
		location: "San Diego,US",
		units: "imperial",
		apiKey: "YOUR_API_KEY"
	}
},
{
	module: "MMM-ShortsOrJacket",
	position: "top_center",
	classes: "medium",
	config: {
		threshold: 65,
		showFromHour: 5,
		showUntilHour: 10
	}
}
```

### Config options

| Option | Default | Description |
|--------|---------|-------------|
| `threshold` | `65` | °F high at or above → shorts |
| `layerThreshold` | `55` | If today's low is below this and high ≥ `threshold` → shorts + jacket |
| `showFromHour` | `5` | First hour to show (0–23) |
| `showUntilHour` | `10` | Hide at this hour (exclusive) |
| `precipFromHour` | `7` | Start of window for rain/snow checks |
| `precipUntilHour` | `19` | End of rain/snow window (exclusive) |
| `shortsMessage` | `dude, wear shorts!` | Message when warm |
| `jacketMessage` | `dude, get a jacket.` | Message when cool or wet |
| `bothMessage` | `dude, wear shorts and grab a jacket!` | Warm day, cool morning |
| `bothEmoji` | `🩳🧥` | Emoji for layered outfit |
| `unavailableMessage` | `dude, look outside` | When forecast unavailable |
| `shortsEmoji` | `🩳` | Emoji for shorts |
| `jacketEmoji` | `🧥` | Emoji for jacket |
| `precipProbabilityThreshold` | `30` | % chance that triggers jacket override |
| `seasonalOverrides` | `[]` | Optional month-based rules |
| `updateInterval` | `60000` | ms between time-window checks |
| `animate` | `true` | Animate DOM updates |

### Seasonal overrides (optional)

```javascript
seasonalOverrides: [
	{ months: [12, 1, 2], recommendation: "jacket" }
]
```

## Testing

```bash
npm test
```

## License

MIT
