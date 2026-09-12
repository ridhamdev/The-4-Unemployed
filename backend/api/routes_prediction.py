from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from backend.ml.inference.predictor import predictor

router = APIRouter(prefix="/api", tags=["Deployed Model Prediction API"])

@router.post("/predict")
def predict_environmental_risk(payload: Dict[str, Any] = Body(...)):
    """
    Deployed Model Inference Endpoint (Section 13 & 25).
    Consumes pre-trained model artifact.
    NEVER retrains the model.
    """
    try:
        factory_feats = payload.get("factory_features", {})
        weather_feats = payload.get("weather_features", {})
        env_feats = payload.get("environmental_features", {})
        date_str = payload.get("date_str")

        result = predictor.predict(
            factory_features=factory_feats,
            weather_features=weather_feats,
            env_features=env_feats,
            date_str=date_str
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
