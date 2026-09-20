"""
Cloud Synchronization Module for Firebase Firestore and AWS DynamoDB.
Handles vehicular telemetry ingestion, offline caching during tunnel outages,
and batch upload when network re-establishes.
"""

import time
from typing import Dict, List, Optional
from core.types import VehicleState


class CloudSyncManager:
    def __init__(self,
                 provider: str = "firebase", # "firebase" or "aws"
                 batch_size: int = 50):
        self.provider = provider
        self.batch_size = batch_size
        self._offline_buffer: List[Dict] = []
        self.synced_batches_count: int = 0
        self.total_records_synced: int = 0

    def format_firebase_document(self, state: VehicleState, trip_id: str) -> Dict:
        """Formats state as a Firebase Firestore GeoPoint document."""
        return {
            "trip_id": trip_id,
            "timestamp": state.timestamp,
            "location": {
                "latitude": state.lat,
                "longitude": state.lon,
                "altitude": state.alt
            },
            "speed_kmh": round(state.speed_mps * 3.6, 1),
            "heading_deg": round(state.yaw_deg, 1),
            "nav_mode": state.mode.value,
            "confidence": {
                "level": state.confidence.confidence_level,
                "radius_m": state.confidence.horizontal_accuracy_m,
                "ellipse_major": state.confidence.semi_major_axis_m,
                "ellipse_minor": state.confidence.semi_minor_axis_m,
                "ellipse_angle": state.confidence.ellipse_angle_deg
            },
            "ai_features": {
                "dynamic_q_scale": round(state.dynamic_q_scale, 2),
                "disturbance": state.detected_disturbance.value,
                "uncertainty_score": round(state.ai_uncertainty_score, 3)
            }
        }

    def format_aws_dynamodb_item(self, state: VehicleState, trip_id: str) -> Dict:
        """Formats state as an AWS DynamoDB item."""
        return {
            "trip_id": {"S": trip_id},
            "timestamp_ms": {"N": str(int(state.timestamp * 1000))},
            "lat": {"N": str(state.lat)},
            "lon": {"N": str(state.lon)},
            "speed_mps": {"N": str(round(state.speed_mps, 2))},
            "mode": {"S": state.mode.value},
            "h_acc_m": {"N": str(state.confidence.horizontal_accuracy_m)},
            "q_scale": {"N": str(round(state.dynamic_q_scale, 2))}
        }

    def push_state(self, state: VehicleState, trip_id: str = "trip_sf_tunnel_001") -> Optional[Dict]:
        """Pushes state to offline buffer; flushes batch when full or online."""
        if self.provider == "firebase":
            doc = self.format_firebase_document(state, trip_id)
        else:
            doc = self.format_aws_dynamodb_item(state, trip_id)

        self._offline_buffer.append(doc)

        if len(self._offline_buffer) >= self.batch_size:
            return self.flush_buffer()
        return None

    def flush_buffer(self) -> Dict:
        """Flushes buffered records to cloud endpoint."""
        count = len(self._offline_buffer)
        if count == 0:
            return {"status": "empty", "count": 0}

        # Simulated cloud batch write (Firebase Firestore batch / AWS DynamoDB BatchWriteItem)
        self.synced_batches_count += 1
        self.total_records_synced += count
        self._offline_buffer.clear()

        return {
            "status": "success",
            "provider": self.provider,
            "flushed_count": count,
            "total_synced": self.total_records_synced
        }
