# Yorru - Google Maps Services
# Weather API and Directions API integrations
# Version: 0.0.1

import httpx
from typing import Optional
from datetime import datetime, timedelta
from config import settings


async def get_coordinates_from_address(address: str) -> Optional[dict]:
    """
    Geocode an address to get latitude and longitude.

    Returns:
        dict with 'lat', 'lng', and 'formatted_address' or None if failed
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                params={
                    "address": address,
                    "key": settings.GOOGLE_MAPS_API_KEY
                }
            )
            data = response.json()
            if data.get("results"):
                location = data["results"][0]["geometry"]["location"]
                return {
                    "lat": location["lat"],
                    "lng": location["lng"],
                    "formatted_address": data["results"][0].get("formatted_address", address)
                }
    except Exception as e:
        print(f"Geocoding error: {e}")
    return None


async def get_weather_forecast(lat: float, lng: float, target_date: Optional[str] = None) -> dict:
    """
    Get weather forecast for a location using Google Weather API.

    Args:
        lat: Latitude
        lng: Longitude
        target_date: Optional date string (YYYY-MM-DD) to get forecast for specific day

    Returns:
        dict with weather data or error message
    """
    try:
        async with httpx.AsyncClient() as client:
            # Google Weather API - Daily Forecast endpoint
            # Docs: https://developers.google.com/maps/documentation/weather/daily-forecast
            response = await client.get(
                "https://weather.googleapis.com/v1/forecast/days:lookup",
                params={
                    "key": settings.GOOGLE_MAPS_API_KEY,
                    "location.latitude": lat,
                    "location.longitude": lng,
                    "days": 10  # Get up to 10 days forecast
                }
            )

            if response.status_code == 200:
                data = response.json()

                # Parse the forecast data
                forecasts = []
                for day in data.get("forecastDays", []):
                    date_info = day.get("displayDate", {})
                    date_str = f"{date_info.get('year', '')}-{str(date_info.get('month', '')).zfill(2)}-{str(date_info.get('day', '')).zfill(2)}"

                    day_part = day.get("daytimeForecast", {})
                    night_part = day.get("nighttimeForecast", {})

                    # Get temperature
                    temp_max = day_part.get("temperature", {}).get("degrees")
                    temp_min = night_part.get("temperature", {}).get("degrees")

                    # Get conditions
                    condition = day_part.get("condition", "")

                    # Get precipitation
                    precip_chance = day_part.get("precipitation", {}).get("probability", {}).get("percent", 0)

                    forecasts.append({
                        "date": date_str,
                        "condition": condition,
                        "temp_high": temp_max,
                        "temp_low": temp_min,
                        "precipitation_chance": precip_chance,
                        "humidity": day_part.get("relativeHumidity"),
                        "wind_speed": day_part.get("wind", {}).get("speed", {}).get("value"),
                        "uv_index": day_part.get("uvIndex")
                    })

                # If target_date specified, filter to that date
                if target_date:
                    for forecast in forecasts:
                        if forecast["date"] == target_date:
                            return {
                                "success": True,
                                "forecast": forecast,
                                "location": {"lat": lat, "lng": lng}
                            }
                    # If date not found in forecast range
                    return {
                        "success": False,
                        "error": f"Weather forecast not available for {target_date}. Forecasts are available for the next 10 days only."
                    }

                return {
                    "success": True,
                    "forecasts": forecasts[:7],  # Return 7 days by default
                    "location": {"lat": lat, "lng": lng}
                }
            else:
                print(f"Weather API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"Weather API error: {response.status_code}"
                }

    except Exception as e:
        print(f"Weather fetch error: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def get_directions(
    origin: str,
    destination: str,
    mode: str = "driving"
) -> dict:
    """
    Get directions and travel time between two locations using Google Directions API.

    Args:
        origin: Starting address or "lat,lng"
        destination: Destination address or "lat,lng"
        mode: Travel mode - "driving", "walking", "bicycling", "transit"

    Returns:
        dict with directions data or error message
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/directions/json",
                params={
                    "origin": origin,
                    "destination": destination,
                    "mode": mode,
                    "key": settings.GOOGLE_MAPS_API_KEY,
                    "alternatives": "true"  # Get alternative routes
                }
            )

            data = response.json()

            if data.get("status") == "OK":
                routes = []
                for route in data.get("routes", []):
                    leg = route.get("legs", [{}])[0]

                    routes.append({
                        "summary": route.get("summary", ""),
                        "distance": leg.get("distance", {}).get("text", ""),
                        "distance_meters": leg.get("distance", {}).get("value", 0),
                        "duration": leg.get("duration", {}).get("text", ""),
                        "duration_seconds": leg.get("duration", {}).get("value", 0),
                        "start_address": leg.get("start_address", ""),
                        "end_address": leg.get("end_address", ""),
                        "steps": len(leg.get("steps", []))
                    })

                # Get the primary route
                primary_route = routes[0] if routes else None

                return {
                    "success": True,
                    "mode": mode,
                    "primary_route": primary_route,
                    "alternative_routes": routes[1:] if len(routes) > 1 else [],
                    "origin": origin,
                    "destination": destination
                }
            else:
                return {
                    "success": False,
                    "error": f"Directions API error: {data.get('status')} - {data.get('error_message', 'No route found')}"
                }

    except Exception as e:
        print(f"Directions fetch error: {e}")
        return {
            "success": False,
            "error": str(e)
        }


def format_weather_response(weather_data: dict, event_date: str, location: str) -> str:
    """
    Format weather data into a user-friendly response.
    """
    if not weather_data.get("success"):
        return f"Unable to get weather forecast: {weather_data.get('error', 'Unknown error')}"

    if "forecast" in weather_data:
        # Single day forecast
        f = weather_data["forecast"]
        temp_str = ""
        if f.get("temp_high") and f.get("temp_low"):
            temp_str = f"**{f['temp_high']}F** / {f['temp_low']}F"
        elif f.get("temp_high"):
            temp_str = f"**{f['temp_high']}F**"

        precip_str = f" | {f['precipitation_chance']}% chance of rain" if f.get("precipitation_chance") else ""

        response = f"**Weather for {event_date}** at {location}:\n\n"
        response += f"{get_weather_emoji(f.get('condition', ''))} {f.get('condition', 'Unknown')}\n"
        response += f"Temperature: {temp_str}{precip_str}\n"

        if f.get("humidity"):
            response += f"Humidity: {f['humidity']}%\n"
        if f.get("wind_speed"):
            response += f"Wind: {f['wind_speed']} mph\n"
        if f.get("uv_index"):
            response += f"UV Index: {f['uv_index']}\n"

        return response

    elif "forecasts" in weather_data:
        # Multi-day forecast
        response = f"**7-Day Forecast** for {location}:\n\n"
        for f in weather_data["forecasts"]:
            emoji = get_weather_emoji(f.get("condition", ""))
            temp_str = f"{f.get('temp_high', '?')}F/{f.get('temp_low', '?')}F" if f.get("temp_high") else "N/A"
            response += f"{f['date']}: {emoji} {f.get('condition', 'Unknown')} - {temp_str}\n"
        return response

    return "Weather data format error"


def get_weather_emoji(condition: str) -> str:
    """Get an emoji for the weather condition."""
    condition_lower = condition.lower()
    if "sun" in condition_lower or "clear" in condition_lower:
        return "☀️"
    elif "cloud" in condition_lower and "part" in condition_lower:
        return "⛅"
    elif "cloud" in condition_lower:
        return ""
    elif "rain" in condition_lower:
        return "🌧️"
    elif "thunder" in condition_lower or "storm" in condition_lower:
        return "⛈️"
    elif "snow" in condition_lower:
        return "❄️"
    elif "fog" in condition_lower or "mist" in condition_lower:
        return "🌫️"
    elif "wind" in condition_lower:
        return "💨"
    else:
        return ""


def format_directions_response(directions_data: dict, mode: str) -> str:
    """
    Format directions data into a user-friendly response.
    """
    if not directions_data.get("success"):
        return f"Unable to get directions: {directions_data.get('error', 'Unknown error')}"

    route = directions_data.get("primary_route")
    if not route:
        return "No route found between these locations."

    mode_emoji = {
        "driving": "🚗",
        "walking": "🚶",
        "bicycling": "🚴",
        "transit": "🚌"
    }.get(mode, "📍")

    response = f"{mode_emoji} **Directions** ({mode.title()})\n\n"
    response += f"📍 From: {route['start_address']}\n"
    response += f"[TARGET] To: {route['end_address']}\n\n"
    response += f"**Distance:** {route['distance']}\n"
    response += f"**Travel Time:** {route['duration']}\n"

    if route.get("summary"):
        response += f"**Route:** via {route['summary']}\n"

    # Add alternative routes if available
    alternatives = directions_data.get("alternative_routes", [])
    if alternatives:
        response += f"\n[PIN] **Alternative Routes:**\n"
        for i, alt in enumerate(alternatives[:2], 1):
            response += f"{i}. {alt['duration']} ({alt['distance']}) via {alt.get('summary', 'alternate route')}\n"

    # Add Google Maps link
    origin_encoded = directions_data.get("origin", "").replace(" ", "+")
    dest_encoded = directions_data.get("destination", "").replace(" ", "+")
    maps_url = f"https://www.google.com/maps/dir/?api=1&origin={origin_encoded}&destination={dest_encoded}&travelmode={mode}"
    response += f"\n🗺️ [Open in Google Maps]({maps_url})"

    return response
