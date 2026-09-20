"""
Hidden Markov Model (HMM) Map Matching Engine.
Pins dead-reckoned coordinates to the legal OpenStreetMap road network,
eliminating lateral drift through tunnels and preventing driving into buildings.
"""

import math
from typing import Dict, List, Optional, Tuple
from map_matching.osm_network import OSMHighwayGraph, RoadSegment


class HMMMapMatcher:
    def __init__(self,
                 graph: Optional[OSMHighwayGraph] = None,
                 sigma_z: float = 6.0,          # Emission distance standard deviation
                 beta: float = 3.0):            # Transition distance parameter
        self.graph = graph or OSMHighwayGraph()
        self.sigma_z = sigma_z
        self.beta = beta

        self.current_segment: Optional[RoadSegment] = None
        self.last_matched_pt: Optional[Tuple[float, float]] = None

    def set_scenario(self, scenario: str):
        self.graph.build_corridor(scenario)
        self.current_segment = None
        self.last_matched_pt = None

    def match(self,
              dead_reckoned_enu: Tuple[float, float],
              vehicle_heading_deg: float) -> Dict:
        """
        Finds the highest-probability road projection for the dead-reckoned state.
        Returns:
            Dict containing matched_enu, segment_id, road_name, distance_to_road_m
        """
        e, n = dead_reckoned_enu
        best_segment = None
        best_proj = (e, n)
        best_score = -1e9
        min_dist = 1e9

        for seg in self.graph.segments:
            proj_pt, dist = self.graph.project_point_to_segment((e, n), seg)

            # Heading difference in degrees
            d_heading = abs(seg.heading_deg - vehicle_heading_deg)
            if d_heading > 180.0:
                d_heading = 360.0 - d_heading

            # Emission log-likelihood: Gaussian distance + Cosine heading alignment
            heading_weight = max(0.1, math.cos(math.radians(d_heading)))
            emission_log_lik = -0.5 * (dist / self.sigma_z)**2 + math.log(heading_weight)

            # Transition penalty if switching segments abruptly
            transition_pen = 0.0
            if self.current_segment is not None and seg.segment_id != self.current_segment.segment_id:
                transition_pen = -1.5

            total_score = emission_log_lik + transition_pen

            if total_score > best_score:
                best_score = total_score
                best_segment = seg
                best_proj = proj_pt
                min_dist = dist

        self.current_segment = best_segment
        self.last_matched_pt = best_proj

        return {
            "matched_enu": [best_proj[0], best_proj[1]],
            "segment_id": best_segment.segment_id if best_segment else "unknown",
            "road_name": best_segment.name if best_segment else "Off-road",
            "is_tunnel_segment": best_segment.is_tunnel if best_segment else False,
            "dist_to_centerline_m": round(min_dist, 2),
            "speed_limit_mps": best_segment.speed_limit_mps if best_segment else 13.8
        }
