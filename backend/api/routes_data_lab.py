import os
import uuid
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from backend.database.database import get_db
from backend.models.db_models import DatasetRecord
from backend.models.schemas import DataLabTrainRequest
from backend.services.data_lab_service import data_lab_service, UPLOAD_DIR

router = APIRouter(prefix="/api/dataset", tags=["Data Laboratory"])

DATASETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "datasets")
SAMPLE_CSV = os.path.join(DATASETS_DIR, "industrial_sample_dataset.csv")

@router.get("/sample/load")
def load_sample_dataset(db: Session = Depends(get_db)):
    """Loads the pre-packaged 120-row industrial dataset into Data Laboratory."""
    if not os.path.exists(SAMPLE_CSV):
        raise HTTPException(status_code=404, detail="Sample dataset not found on disk.")

    dataset_id = "sample-industrial-dataset"
    # Copy to uploads
    dest_path = os.path.join(UPLOAD_DIR, f"{dataset_id}.csv")
    shutil.copy(SAMPLE_CSV, dest_path)

    overview = data_lab_service.analyze_csv(dest_path, dataset_id, "industrial_sample_dataset.csv")

    # Upsert into DB
    existing = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not existing:
        rec = DatasetRecord(
            id=dataset_id,
            filename="industrial_sample_dataset.csv",
            rows_count=overview["rows_count"],
            cols_count=overview["cols_count"],
            summary_json=overview,
            file_path=dest_path
        )
        db.add(rec)
        db.commit()

    return overview

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Uploads user CSV for schema inspection, stats, and baseline model training."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    dataset_id = f"ds-{uuid.uuid4().hex[:8]}"
    save_path = os.path.join(UPLOAD_DIR, f"{dataset_id}_{file.filename}")

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        overview = data_lab_service.analyze_csv(save_path, dataset_id, file.filename)
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    record = DatasetRecord(
        id=dataset_id,
        filename=file.filename,
        rows_count=overview["rows_count"],
        cols_count=overview["cols_count"],
        summary_json=overview,
        file_path=save_path
    )
    db.add(record)
    db.commit()

    return overview

@router.get("/{id}")
def get_dataset(id: str, db: Session = Depends(get_db)):
    record = db.query(DatasetRecord).filter(DatasetRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return record.summary_json

@router.post("/{id}/train_baseline")
def train_baseline_model(id: str, req: DataLabTrainRequest, db: Session = Depends(get_db)):
    record = db.query(DatasetRecord).filter(DatasetRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if not os.path.exists(record.file_path):
        raise HTTPException(status_code=404, detail="Underlying dataset file missing on server.")

    try:
        results = data_lab_service.train_baseline_models(
            file_path=record.file_path,
            target_column=req.target_column,
            feature_columns=req.feature_columns,
            test_size=req.test_size
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
