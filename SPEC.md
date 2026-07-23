# MMM-ShortsOrJacket — Specification

## Overview

MagicMirror² third-party module that recommends shorts or a jacket based on today's forecast high temperature. Built for a home mirror; listens to the built-in `weather` module.

## Requirements (signed off)

| Requirement | Decision |
|-------------|----------|
| Shorts message | `"dude, wear shorts!"` |
| Jacket message | `"dude, get a jacket."` |
| No weather data | `"dude, look outside"` |
| Temperature source | Today's forecast **max high** (`forecastArray[0].maxTemperature`) |
| Units | **Fahrenheit** |
| Threshold default | `65` °F (configurable) |
| Comparison | `>= threshold` → shorts; `< threshold` → jacket |
| Rain / snow | Override to jacket recommendation |
| Weather source | Built-in `weather` module via `WEATHER_UPDATED` |
| Display | Text + emoji + temperature |
| Time window | Morning only, visible until **10:00** (configurable start hour) |
| Position | User-adjustable; default `top_center` |
| Size | Medium (MagicMirror `small` table class equivalent) |
| Seasonal overrides | Optional config |
| MagicMirror version | Latest (2.28+) |
| Install | Manual clone **or** MMM-Installer |
| Tests | Lightweight unit tests for recommendation logic |

## Configuration

```javascript
{
  module: "MMM-ShortsOrJacket",
  position: "top_center",
  classes: "medium",
  config: {
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
    updateInterval: 60 * 1000
  }
}
```

### Seasonal overrides (optional)

```javascript
seasonalOverrides: [
  { months: [12, 1, 2], recommendation: "jacket" }
]
```

- `months`: 1–12 (January = 1)
- `recommendation`: `"shorts"` or `"jacket"`

When the current month matches a rule, that recommendation is forced (still subject to rain/snow override → jacket).

## Recommendation logic

```
1. If outside time window (before showFromHour or at/after showUntilHour) → hidden
2. If no forecast data → "dude, look outside"
3. If seasonal override active → use override
4. Else if rain/snow likely today → jacket
5. Else if maxHigh >= threshold → shorts
6. Else → jacket
```

### Precipitation detection

Today's forecast (`forecastArray[0]`) is checked for:

- `weatherType` containing rain/snow keywords (case-insensitive)
- `precipitationAmount > 0`
- `precipitationProbability >= precipProbabilityThreshold` (default 30%)

## Architecture

```
weather module ──WEATHER_UPDATED──► MMM-ShortsOrJacket
                                         │
                                         ├─ recommendation.js (pure logic)
                                         └─ getDom() → message + emoji + temp
```

## Files

| File | Purpose |
|------|---------|
| `MMM-ShortsOrJacket.js` | Core MagicMirror module |
| `MMM-ShortsOrJacket.css` | Styles |
| `recommendation.js` | Testable recommendation logic |
| `test/recommendation.test.js` | Unit tests |
| `package.json` | Metadata + test script |
| `README.md` | Install and usage |

## UI

**Shorts:**
```
🩳  dude, wear shorts!
    High: 78°F
```

**Jacket:**
```
🧥  dude, get a jacket.
    High: 58°F
```

**Unavailable:**
```
dude, look outside
```

## Dependencies

- MagicMirror² with `weather` module configured for forecast/daily data
- Weather module `units: "imperial"` recommended so temperatures arrive in °F
