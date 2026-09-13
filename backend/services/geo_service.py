"""
Geographic Location Registry Service (Section 13, 15, 17)
Provides structured Indian States and industrial cities with centroid coordinates
and default zoom levels for hierarchical location onboarding.
"""

from typing import List, Dict, Any, Optional

INDIA_GEO_REGISTRY: Dict[str, List[Dict[str, Any]]] = {
    "Gujarat": [
        {"name": "Ahmedabad", "lat": 23.0225, "lng": 72.5714, "zoom": 12, "hubs": ["Vatva GIDC", "Naroda GIDC", "Odhav GIDC", "Sanand Industrial Hub"]},
        {"name": "Surat", "lat": 21.1702, "lng": 72.8311, "zoom": 12, "hubs": ["Pandesara GIDC", "Sachin GIDC", "Katargam Textile Hub", "Hazira Industrial Belt"]},
        {"name": "Vadodara", "lat": 22.3072, "lng": 73.1812, "zoom": 12, "hubs": ["Nandesari Industrial Estate", "Makarpura GIDC", "Ranoli Chemical Corridor", "Savli GIDC"]},
        {"name": "Ankleshwar", "lat": 21.6264, "lng": 73.0038, "zoom": 13, "hubs": ["Ankleshwar GIDC Chemical Hub", "GIDC Phase 1-4"]},
        {"name": "Bharuch", "lat": 21.7051, "lng": 72.9959, "zoom": 13, "hubs": ["Dahej PCPIR", "Vilayat Industrial Estate", "Narmada River Industrial Corridor"]},
        {"name": "Vapi", "lat": 20.3713, "lng": 72.9048, "zoom": 13, "hubs": ["Vapi GIDC Chemical Estate", "Daman Ganga Industrial Area"]},
        {"name": "Anand", "lat": 22.5645, "lng": 72.9289, "zoom": 13, "hubs": ["Anand Agro-Food Corridor", "Vitthal Udyognagar GIDC"]},
        {"name": "Rajkot", "lat": 22.3039, "lng": 70.8022, "zoom": 12, "hubs": ["Aji GIDC", "Shapar-Veraval Industrial Zone", "Metoda GIDC"]},
        {"name": "Jamnagar", "lat": 22.4707, "lng": 70.0577, "zoom": 12, "hubs": ["Moti Khavdi Refining Hub", "Jamnagar Dared GIDC"]},
        {"name": "Bhavnagar", "lat": 21.7645, "lng": 72.1519, "zoom": 13, "hubs": ["Chitra GIDC", "Alang Ship Recycling Yard", "Sihor Rolling Mills"]},
        {"name": "Gandhinagar", "lat": 23.2156, "lng": 72.6369, "zoom": 13, "hubs": ["Koba Electronics SEZ", "GIDC Sector 25-28"]},
        {"name": "Morbi", "lat": 22.8120, "lng": 70.8378, "zoom": 13, "hubs": ["Morbi Ceramic Cluster", "Lakhdhirpur Road Ceramic Zone"]},
        {"name": "Dahej", "lat": 21.7130, "lng": 72.5850, "zoom": 13, "hubs": ["Dahej PCPIR Petrochemical Complex", "Dahej SEZ"]},
        {"name": "Hazira", "lat": 21.1150, "lng": 72.6520, "zoom": 13, "hubs": ["Hazira Port & Heavy Industrial Estate", "Mora Chemical Hub"]}
    ],
    "Maharashtra": [
        {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777, "zoom": 12, "hubs": ["Chembur Petrochemical Corridor", "Kurla Industrial Zone"]},
        {"name": "Thane / Navi Mumbai", "lat": 19.1860, "lng": 73.0039, "zoom": 12, "hubs": ["Thane-Belapur MIDC Chemical Zone", "Rabale MIDC", "Mahape TTC"]},
        {"name": "Pune", "lat": 18.5204, "lng": 73.8567, "zoom": 12, "hubs": ["Bhosari MIDC", "Pimpri-Chinchwad Auto Cluster", "Chakan Auto-Engineering Hub", "Ranjangaon MIDC"]},
        {"name": "Tarapur", "lat": 19.8550, "lng": 72.6950, "zoom": 13, "hubs": ["Tarapur MIDC Chemical & Textile Complex", "Boisar Industrial Zone"]},
        {"name": "Nagpur", "lat": 21.1458, "lng": 79.0882, "zoom": 12, "hubs": ["Butibori MIDC Industrial Estate", "Hingna MIDC"]},
        {"name": "Nashik", "lat": 19.9975, "lng": 73.7898, "zoom": 12, "hubs": ["Ambad MIDC", "Satpur MIDC Engineering Cluster"]},
        {"name": "Aurangabad (Chhatrapati Sambhajinagar)", "lat": 19.8762, "lng": 75.3433, "zoom": 12, "hubs": ["Waluj MIDC", "Chikalthana MIDC", "Shendra DMIC Hub"]},
        {"name": "Kolhapur", "lat": 16.7050, "lng": 74.2433, "zoom": 13, "hubs": ["Shiroli MIDC Foundry Hub", "Gokul Shirgaon MIDC"]}
    ],
    "Rajasthan": [
        {"name": "Jaipur", "lat": 26.9124, "lng": 75.7873, "zoom": 12, "hubs": ["Vishwakarma Industrial Area (VKI)", "Sitapura Industrial Area", "Mansarovar RIICO"]},
        {"name": "Bhiwadi", "lat": 28.2100, "lng": 76.8600, "zoom": 13, "hubs": ["Bhiwadi RIICO Industrial Estate", "Khushkhera Industrial Area", "Chopanki Hub"]},
        {"name": "Jodhpur", "lat": 26.2389, "lng": 73.0243, "zoom": 12, "hubs": ["Basni Industrial Area", "Boronada SEZ", "Sanganeer Textile Zone"]},
        {"name": "Kota", "lat": 25.2138, "lng": 75.8648, "zoom": 13, "hubs": ["Kota Industrial Area", "Ranpur RIICO", "Thermal Power Cluster"]},
        {"name": "Udaipur", "lat": 24.5854, "lng": 73.7125, "zoom": 13, "hubs": ["Mewar Industrial Area", "Madri Industrial Area", "Gudli RIICO"]}
    ],
    "Madhya Pradesh": [
        {"name": "Indore", "lat": 22.7196, "lng": 75.8577, "zoom": 12, "hubs": ["Sanwer Road Industrial Area", "Palda Industrial Area", "Pithampur Sector 1-3"]},
        {"name": "Pithampur", "lat": 22.6100, "lng": 75.6800, "zoom": 13, "hubs": ["Pithampur Auto & Pharma SEZ", "Sector 1 & 2 Industrial Area"]},
        {"name": "Bhopal", "lat": 23.2599, "lng": 77.4126, "zoom": 12, "hubs": ["Mandideep Industrial Area", "Govindpura Industrial Estate"]},
        {"name": "Gwalior", "lat": 26.2183, "lng": 78.1828, "zoom": 12, "hubs": ["Malanpur Industrial Area", "Maharajpura Industrial Area"]},
        {"name": "Dewas", "lat": 22.9676, "lng": 76.0534, "zoom": 13, "hubs": ["Dewas Industrial Area Phase 1-3", "Tata Chemical Corridor"]}
    ],
    "Karnataka": [
        {"name": "Bengaluru", "lat": 12.9716, "lng": 77.5946, "zoom": 12, "hubs": ["Peenya Industrial Area", "Bommasandra Industrial Area", "Electronic City", "Whitefield EPIP"]},
        {"name": "Bidadi", "lat": 12.7950, "lng": 77.3850, "zoom": 13, "hubs": ["Bidadi KIADB Industrial Area", "Auto Manufacturing Hub"]},
        {"name": "Mysuru", "lat": 12.2958, "lng": 76.6394, "zoom": 12, "hubs": ["Hebbal Industrial Area", "Belagola KIADB", "Nanjangud Industrial Area"]},
        {"name": "Mangaluru", "lat": 12.9141, "lng": 74.8560, "zoom": 12, "hubs": ["Baikampady Industrial Estate", "Mangalore Special Economic Zone (MSEZ)"]}
    ],
    "Tamil Nadu": [
        {"name": "Chennai", "lat": 13.0827, "lng": 80.2707, "zoom": 12, "hubs": ["Ambattur Industrial Estate", "Guindy Industrial Estate", "Manali Petrochemical Corridor"]},
        {"name": "Sriperumbudur", "lat": 12.9675, "lng": 79.9425, "zoom": 13, "hubs": ["Sriperumbudur SIPCOT Auto & Electronics Hub", "Oragadam Industrial Corridor"]},
        {"name": "Coimbatore", "lat": 11.0168, "lng": 76.9558, "zoom": 12, "hubs": ["SIDCO Kurichi", "Peelamedu Industrial Estate", "Textile Machinery Cluster"]},
        {"name": "Tirupur", "lat": 11.1085, "lng": 77.3411, "zoom": 13, "hubs": ["Tirupur Wet Processing & Dyeing Hub", "SIDCO Mudalipalayam"]}
    ],
    "Delhi / NCR": [
        {"name": "New Delhi (Okhla)", "lat": 28.5355, "lng": 77.2680, "zoom": 13, "hubs": ["Okhla Industrial Area Phase 1-3", "Mohan Cooperative"]},
        {"name": "North Delhi (Bawana & Narela)", "lat": 28.7950, "lng": 77.0500, "zoom": 13, "hubs": ["Bawana Industrial Area", "Narela DSIIDC Industrial Park"]},
        {"name": "West Delhi (Mayapuri & Kirti Nagar)", "lat": 28.6350, "lng": 77.1250, "zoom": 13, "hubs": ["Mayapuri Industrial Area Phase 1-2", "Kirti Nagar Industrial Area"]}
    ],
    "Haryana": [
        {"name": "Gurugram / Manesar", "lat": 28.4595, "lng": 77.0266, "zoom": 12, "hubs": ["IMT Manesar Industrial Estate", "Udyog Vihar Phase 1-5", "Sector 37 Industrial Area"]},
        {"name": "Faridabad", "lat": 28.4089, "lng": 77.3178, "zoom": 12, "hubs": ["Sector 24-25 Industrial Area", "Old Faridabad Manufacturing Corridor"]},
        {"name": "Panipat", "lat": 29.3909, "lng": 76.9635, "zoom": 13, "hubs": ["Panipat Textile Cluster", "Refinery Industrial Corridor", "Sector 29 Industrial Estate"]}
    ],
    "Uttar Pradesh": [
        {"name": "Noida / Greater Noida", "lat": 28.5355, "lng": 77.3910, "zoom": 12, "hubs": ["Noida Sector 57-68 Industrial Areas", "Ecotech Greater Noida", "Surajpur Industrial Area"]},
        {"name": "Kanpur", "lat": 26.4499, "lng": 80.3319, "zoom": 12, "hubs": ["Jajmau Tannery Cluster", "Panki Industrial Area", "Fazalganj Industrial Estate"]},
        {"name": "Ghaziabad", "lat": 28.6692, "lng": 77.4538, "zoom": 12, "hubs": ["Sahibabad Industrial Area Site 4", "Loni Road Industrial Area", "Kavi Nagar Industrial Area"]}
    ],
    "West Bengal": [
        {"name": "Kolkata / Howrah", "lat": 22.5726, "lng": 88.3639, "zoom": 12, "hubs": ["Taratala Industrial Area", "Howrah Foundry & Engineering Cluster", "Kalyani Industrial Area"]},
        {"name": "Haldia", "lat": 22.0667, "lng": 88.0698, "zoom": 13, "hubs": ["Haldia Petrochemical Complex", "Port Industrial Corridor", "Chemical Hub"]},
        {"name": "Durgapur / Asansol", "lat": 23.4833, "lng": 87.3167, "zoom": 12, "hubs": ["Durgapur Steel & Chemical Corridor", "Asansol-Raniganj Industrial Belt"]}
    ],
    "Telangana": [
        {"name": "Hyderabad", "lat": 17.3850, "lng": 78.4867, "zoom": 12, "hubs": ["Patancheru Industrial Area", "Jeedimetla IDA", "Bollaram Industrial Area", "Sanath Nagar IDA"]},
        {"name": "Medak", "lat": 18.0480, "lng": 78.2610, "zoom": 12, "hubs": ["Pashamylaram IDA", "Medak Pharma SEZ"]}
    ]
}

class GeoService:
    @staticmethod
    def get_states() -> List[str]:
        """Returns ordered list of supported Indian states."""
        return list(INDIA_GEO_REGISTRY.keys())

    @staticmethod
    def get_cities_for_state(state: str) -> List[Dict[str, Any]]:
        """Returns structured list of cities with coordinates for the selected state."""
        return INDIA_GEO_REGISTRY.get(state, [])

    @staticmethod
    def get_city_details(state: str, city_name: str) -> Optional[Dict[str, Any]]:
        """Retrieves coordinates and hubs for a specific city."""
        cities = INDIA_GEO_REGISTRY.get(state, [])
        for c in cities:
            if c["name"].lower() == city_name.lower():
                return c
        return None

geo_service = GeoService()
