import math
from typing import Dict, Any, List

class SpatialGridService:
    """
    Spatial Grid Generation Service.
    Divides the industrial analysis territory (5 km - 10 km radius) into regular
    spatial analysis cells (e.g. 1 km x 1 km resolution compatible with Sentinel-5P
    diffusion scales and Sentinel-2 optical aggregations).
    Calculates distance to factory, residential receptors, waterways, and transport corridors.
    """

    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2.0) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def generate_grid(
        self,
        factory_lat: float = 22.4125,
        factory_lng: float = 73.0944,
        radius_km: float = 5.0,
        cell_size_km: float = 1.0
    ) -> List[Dict[str, Any]]:
        cells = []

        # Convert km to approx lat/lng delta (at ~22 deg N, 1 deg lat ~ 110.8 km, 1 deg lng ~ 103.0 km)
        km_per_lat = 110.8
        km_per_lng = 103.0

        lat_step = cell_size_km / km_per_lat
        lng_step = cell_size_km / km_per_lng

        max_steps = int(math.ceil(radius_km / cell_size_km))

        # Known regional landmark receptors around Nandesari/Vadodara chemical estate
        residential_anchor = (factory_lat + 0.015, factory_lng + 0.012) # Nandesari village & township
        water_anchor = (factory_lat - 0.022, factory_lng + 0.005)       # Mini River & industrial canal
        road_anchor = (factory_lat - 0.010, factory_lng + 0.025)        # NH-48 chemical transport corridor

        cell_index = 0
        for i in range(-max_steps, max_steps + 1):
            for j in range(-max_steps, max_steps + 1):
                c_lat = round(factory_lat + (i * lat_step), 4)
                c_lng = round(factory_lng + (j * lng_step), 4)

                dist_factory = self.haversine_distance(factory_lat, factory_lng, c_lat, c_lng)
                if dist_factory <= radius_km:
                    cell_index += 1
                    dist_res = round(self.haversine_distance(c_lat, c_lng, residential_anchor[0], residential_anchor[1]), 2)
                    dist_water = round(self.haversine_distance(c_lat, c_lng, water_anchor[0], water_anchor[1]), 2)
                    dist_road = round(self.haversine_distance(c_lat, c_lng, road_anchor[0], road_anchor[1]), 2)

                    # Land use classification based on distance from core industrial zone
                    if dist_factory < 1.5:
                        land_use = "Heavy Industrial Core"
                        cell_ndvi = 0.12
                        cell_ndbi = 0.32
                        cell_ndwi = -0.18
                    elif dist_res < 1.2:
                        land_use = "Residential / Commercial Settlement"
                        cell_ndvi = 0.22
                        cell_ndbi = 0.24
                        cell_ndwi = -0.12
                    elif dist_water < 1.0:
                        land_use = "Riparian Buffer / Waterway"
                        cell_ndvi = 0.35
                        cell_ndbi = 0.05
                        cell_ndwi = 0.15
                    else:
                        land_use = "Mixed Semi-Urban / Agriculture"
                        cell_ndvi = 0.28
                        cell_ndbi = 0.12
                        cell_ndwi = -0.10

                    cells.append({
                        "cell_id": f"CELL_{cell_index:03d}",
                        "latitude": c_lat,
                        "longitude": c_lng,
                        "grid_x": i,
                        "grid_y": j,
                        "dist_from_factory_km": round(dist_factory, 2),
                        "dist_from_residential_km": dist_res,
                        "dist_from_water_km": dist_water,
                        "dist_from_road_km": dist_road,
                        "land_use_type": land_use,
                        "cell_ndvi": cell_ndvi,
                        "cell_ndbi": cell_ndbi,
                        "cell_ndwi": cell_ndwi
                    })

        return cells

spatial_grid_service = SpatialGridService()
