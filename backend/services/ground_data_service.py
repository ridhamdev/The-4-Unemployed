import os
import pandas as pd
from typing import Dict, Any, List

DATA_RAW_GROUND = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "raw", "ground_monitoring"
)
os.makedirs(DATA_RAW_GROUND, exist_ok=True)

class GroundDataService:
    """
    Service for ingesting and managing Continuous Ambient Air Quality Monitoring 
    Stations (CAAQMS) from Central/State Pollution Control Boards (CPCB/GPCB).
    Schema: station_id, latitude, longitude, timestamp, pollutant, value, unit, source.
    """

    def parse_caaqms_csv(self, file_path: str) -> pd.DataFrame:
        df = pd.read_csv(file_path)
        required = ["date", "pollutant", "value"]
        for col in required:
            if col not in df.columns:
                raise ValueError(f"Ground monitoring CSV missing required column: {col}")
        return df

    def get_ground_observations(
        self,
        lat: float = 22.4125,
        lng: float = 73.0944,
        start_date: str = "2023-01-01",
        end_date: str = "2024-12-31"
    ) -> pd.DataFrame:
        csv_file = os.path.join(DATA_RAW_GROUND, f"cpcb_caaqms_vadodara_2023_2024.csv")
        if os.path.exists(csv_file):
            return pd.read_csv(csv_file)
        return pd.DataFrame()

ground_data_service = GroundDataService()
