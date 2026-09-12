import os
import math
import logging
import requests
import pandas as pd
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

DATA_RAW_WEATHER = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "raw", "weather"
)
os.makedirs(DATA_RAW_WEATHER, exist_ok=True)

class WeatherService:
    """
    Scientific Meteorological Service.
    Queries the official Open-Meteo Historical Weather API (ERA5 Reanalysis).
    Decomposes wind speed and dominant direction into continuous orthogonal vector
    components (wind_u, wind_v) to correctly model atmospheric transport without
    artificial 0°/360° numerical discontinuity.
    """

    API_URL = "https://archive-api.open-meteo.com/v1/archive"

    def fetch_historical_weather(
        self,
        lat: float,
        lng: float,
        start_date: str = "2023-01-01",
        end_date: str = "2024-12-31",
        save_csv: bool = True
    ) -> pd.DataFrame:
        params = {
            "latitude": round(lat, 4),
            "longitude": round(lng, 4),
            "start_date": start_date,
            "end_date": end_date,
            "daily": [
                "temperature_2m_mean",
                "relative_humidity_2m_mean",
                "precipitation_sum",
                "wind_speed_10m_max",
                "wind_direction_10m_dominant",
                "surface_pressure_mean"
            ],
            "timezone": "auto"
        }

        try:
            res = requests.get(self.API_URL, params=params, timeout=25.0)
            if res.status_code == 200:
                data = res.json()
                daily = data.get("daily", {})
                dates = daily.get("time", [])

                if not dates:
                    raise ValueError("No daily records returned from weather API")

                temps = daily.get("temperature_2m_mean", [])
                rhs = daily.get("relative_humidity_2m_mean", [])
                precips = daily.get("precipitation_sum", [])
                pressures = daily.get("surface_pressure_mean", [])
                wind_speeds = daily.get("wind_speed_10m_max", [])
                wind_dirs = daily.get("wind_direction_10m_dominant", [])

                rows = []
                for i in range(len(dates)):
                    d_str = dates[i]
                    t = temps[i] if temps and i < len(temps) else None
                    rh = rhs[i] if rhs and i < len(rhs) else None
                    prec = precips[i] if precips and i < len(precips) else 0.0
                    press = pressures[i] if pressures and i < len(pressures) else 1013.25
                    spd_kmh = wind_speeds[i] if wind_speeds and i < len(wind_speeds) else 0.0
                    deg = wind_dirs[i] if wind_dirs and i < len(wind_dirs) else 0.0

                    # Convert km/h to m/s
                    spd_ms = (spd_kmh or 0.0) * (1000.0 / 3600.0)
                    deg_val = deg or 0.0
                    rad = math.radians(deg_val)

                    # U (east-west component) and V (north-south component)
                    wind_u = -spd_ms * math.sin(rad)
                    wind_v = -spd_ms * math.cos(rad)

                    rows.append({
                        "date": d_str,
                        "latitude": lat,
                        "longitude": lng,
                        "temperature_c": round(t, 2) if t is not None else None,
                        "relative_humidity_pct": round(rh, 1) if rh is not None else None,
                        "precipitation_mm": round(prec, 2) if prec is not None else 0.0,
                        "surface_pressure_hpa": round(press, 1) if press is not None else 1013.0,
                        "wind_speed_ms": round(spd_ms, 2),
                        "wind_direction_deg": round(deg_val, 1),
                        "wind_u": round(wind_u, 3),
                        "wind_v": round(wind_v, 3),
                        "source": "ERA5 Reanalysis (Open-Meteo Historical Archive)"
                    })

                df = pd.DataFrame(rows)
                if save_csv:
                    out_path = os.path.join(DATA_RAW_WEATHER, f"era5_weather_{lat}_{lng}_{start_date}_{end_date}.csv")
                    df.to_csv(out_path, index=False)
                    logger.info(f"Saved {len(df)} weather records to {out_path}")
                return df
            else:
                raise RuntimeError(f"Open-Meteo returned status {res.status_code}: {res.text}")
        except Exception as ex:
            logger.error(f"Failed to fetch historical weather: {ex}")
            raise ex

weather_service = WeatherService()
