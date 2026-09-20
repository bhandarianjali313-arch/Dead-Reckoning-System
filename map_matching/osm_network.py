"""
OpenStreetMap (OSM) Road Network Graph Representation with Multi-Regional Support.
Supports major Indian highway and tunnel corridors:
1. Mumbai Coastal Road Undersea Tunnel (2.07 km, Maharashtra, India)
2. Lucknow BBD University & Ayodhya Highway Corridor (NH-27, Uttar Pradesh, India)
3. New Delhi Pragati Maidan Transit Tunnel (1.3 km, New Delhi, India)
4. Atal Tunnel Rohtang (9.02 km, Himachal Pradesh, India)
"""

import math
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


@dataclass
class RoadSegment:
    segment_id: str
    name: str
    start_enu: Tuple[float, float]       # (E, N)
    end_enu: Tuple[float, float]         # (E, N)
    speed_limit_mps: float
    is_tunnel: bool
    heading_deg: float


class OSMHighwayGraph:
    def __init__(self, scenario: str = "mumbai_tunnel"):
        self.scenario = scenario
        self.segments: List[RoadSegment] = []
        self.build_corridor(scenario)

    def build_corridor(self, scenario: str):
        self.segments.clear()
        self.scenario = scenario

        if scenario == "lucknow_bbd":
            # Lucknow BBD University & Ayodhya Highway (NH-27) Corridor
            self.add_segment("lk_1", "Faizabad Road (Ayodhya Highway, NH-27)", (0.0, 0.0), (0.0, 300.0), 16.6, False)
            self.add_segment("lk_2", "BBD University (BBDU Main Gate Frontage)", (0.0, 300.0), (80.0, 650.0), 13.8, False)
            self.add_segment("lk_3", "Indira Canal Bridge & Approach", (80.0, 650.0), (80.0, 1100.0), 19.4, False)
            self.add_segment("lk_4", "BBD Transit Underpass & Subway Corridor", (80.0, 1100.0), (120.0, 1900.0), 22.2, True)
            self.add_segment("lk_5", "Indira Canal Aqueduct Link", (120.0, 1900.0), (160.0, 2300.0), 22.2, True)
            self.add_segment("lk_6", "Ayodhya Expressway / Shaheed Path Flyover", (160.0, 2300.0), (160.0, 3000.0), 25.0, False)

        elif scenario == "delhi_tunnel":
            # New Delhi Pragati Maidan Transit Tunnel (1.3 km)
            self.add_segment("dl_1", "India Gate C-Hexagon & Tilak Marg", (0.0, 0.0), (0.0, 250.0), 13.8, False)
            self.add_segment("dl_2", "Mathura Road Transit Link", (0.0, 250.0), (100.0, 550.0), 13.8, False)
            self.add_segment("dl_3", "Pragati Maidan Tunnel West Portal", (100.0, 550.0), (120.0, 1100.0), 19.4, True)
            self.add_segment("dl_4", "Pragati Maidan Tunnel (Underground Corridor)", (120.0, 1100.0), (160.0, 1850.0), 19.4, True)
            self.add_segment("dl_5", "Pragati Maidan East Portal Exit", (160.0, 1850.0), (180.0, 2150.0), 16.6, True)
            self.add_segment("dl_6", "Ring Road / Sarai Kale Khan Expressway", (180.0, 2150.0), (180.0, 2800.0), 22.2, False)

        elif scenario == "atal_tunnel":
            # Atal Tunnel Rohtang (9.02 km, Manali - Leh Highway)
            self.add_segment("at_1", "Manali - Leh Highway Approach (NH-3)", (0.0, 0.0), (0.0, 350.0), 13.8, False)
            self.add_segment("at_2", "Atal Tunnel South Portal (Dhundi, 3060m)", (0.0, 350.0), (50.0, 800.0), 16.6, False)
            self.add_segment("at_3", "Atal Tunnel Section 1 (Sub-surface)", (50.0, 800.0), (100.0, 1600.0), 22.2, True)
            self.add_segment("at_4", "Atal Tunnel Central Trans-Himalayan Bore", (100.0, 1600.0), (150.0, 2400.0), 22.2, True)
            self.add_segment("at_5", "Atal Tunnel North Portal (Teling, Sissu)", (150.0, 2400.0), (180.0, 2800.0), 22.2, True)
            self.add_segment("at_6", "Lahaul Valley Chandra River Highway", (180.0, 2800.0), (180.0, 3200.0), 16.6, False)

        else:
            # Default: Mumbai Coastal Road Undersea Tunnel (2.07 km, Marine Drive -> Worli)
            self.add_segment("mb_1", "Marine Drive (Netaji Subhash Chandra Bose Rd)", (0.0, 0.0), (0.0, 260.0), 13.8, False)
            self.add_segment("mb_2", "Girgaon Chowpatty Coastal Road Link", (0.0, 260.0), (60.0, 580.0), 13.8, False)
            self.add_segment("mb_3", "Mumbai Coastal Road Tunnel South Portal", (60.0, 580.0), (100.0, 1100.0), 22.2, True)
            self.add_segment("mb_4", "Coastal Tunnel (Under Malabar Hill & Arabian Sea)", (100.0, 1100.0), (150.0, 1850.0), 22.2, True)
            self.add_segment("mb_5", "Coastal Tunnel North Portal (Priyadarshini Park)", (150.0, 1850.0), (180.0, 2150.0), 22.2, True)
            self.add_segment("mb_6", "Worli Sea Face Coastal Expressway", (180.0, 2150.0), (180.0, 2800.0), 22.2, False)

    def add_segment(self, seg_id: str, name: str, start: Tuple[float, float],
                    end: Tuple[float, float], speed_limit: float, is_tunnel: bool):
        de = end[0] - start[0]
        dn = end[1] - start[1]
        heading = (math.degrees(math.atan2(de, dn)) + 360.0) % 360.0

        self.segments.append(RoadSegment(
            segment_id=seg_id,
            name=name,
            start_enu=start,
            end_enu=end,
            speed_limit_mps=speed_limit,
            is_tunnel=is_tunnel,
            heading_deg=heading
        ))

    def project_point_to_segment(self, pt: Tuple[float, float], seg: RoadSegment) -> Tuple[Tuple[float, float], float]:
        px, py = pt
        x1, y1 = seg.start_enu
        x2, y2 = seg.end_enu

        dx = x2 - x1
        dy = y2 - y1
        seg_len_sq = dx*dx + dy*dy

        if seg_len_sq < 1e-6:
            dist = math.sqrt((px - x1)**2 + (py - y1)**2)
            return (x1, y1), dist

        t = max(0.0, min(1.0, ((px - x1)*dx + (py - y1)*dy) / seg_len_sq))
        proj_x = x1 + t * dx
        proj_y = y1 + t * dy

        dist = math.sqrt((px - proj_x)**2 + (py - proj_y)**2)
        return (proj_x, proj_y), dist
