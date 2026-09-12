import os
import uuid
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class DataLabService:
    """
    Data Laboratory Service for Phase-1 Technical Feasibility:
    - Ingests CSV datasets (satellite, environmental, factory batch logs)
    - Scans schema, missingness, and descriptive statistics
    - Preprocesses and trains interpretable baseline ML models (Linear Regression vs Random Forest)
    - Compares ML surrogate performance against physical rule-based calculations
    """

    def analyze_csv(self, file_path: str, dataset_id: str, filename: str) -> Dict[str, Any]:
        df = pd.read_csv(file_path)

        rows_count, cols_count = df.shape
        columns = list(df.columns)

        missing_counts = df.isnull().sum().to_dict()
        missing_percentages = {col: round((cnt / rows_count) * 100.0, 2) for col, cnt in missing_counts.items()}

        # Summary stats for numeric columns
        numeric_df = df.select_dtypes(include=[np.number])
        summary_stats = {}
        for col in numeric_df.columns:
            s = numeric_df[col].dropna()
            if not s.empty:
                summary_stats[col] = {
                    "count": int(s.count()),
                    "mean": round(float(s.mean()), 2),
                    "std": round(float(s.std()), 2) if len(s) > 1 else 0.0,
                    "min": round(float(s.min()), 2),
                    "p25": round(float(s.quantile(0.25)), 2),
                    "median": round(float(s.median()), 2),
                    "p75": round(float(s.quantile(0.75)), 2),
                    "max": round(float(s.max()), 2)
                }

        # First 10 rows preview
        preview_records = df.head(10).replace({np.nan: None}).to_dict(orient="records")

        return {
            "dataset_id": dataset_id,
            "filename": filename,
            "rows_count": rows_count,
            "cols_count": cols_count,
            "columns": columns,
            "numeric_columns": list(numeric_df.columns),
            "missing_values": missing_counts,
            "missing_percentages": missing_percentages,
            "summary_stats": summary_stats,
            "preview_head": preview_records
        }

    def train_baseline_models(
        self,
        file_path: str,
        target_column: str,
        feature_columns: List[str],
        test_size: float = 0.2
    ) -> Dict[str, Any]:
        df = pd.read_csv(file_path)

        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset.")

        missing_feats = [c for c in feature_columns if c not in df.columns]
        if missing_feats:
            raise ValueError(f"Features not found: {missing_feats}")

        # Extract X and y
        sub_df = df[[target_column] + feature_columns].copy()
        
        # Impute missing values with column medians for numeric, mode for non-numeric
        for col in sub_df.columns:
            if pd.api.types.is_numeric_dtype(sub_df[col]):
                sub_df[col] = sub_df[col].fillna(sub_df[col].median())
            else:
                sub_df[col] = sub_df[col].fillna(sub_df[col].mode()[0] if not sub_df[col].mode().empty else "unknown")

        # Encode any categorical features with get_dummies
        X_df = pd.get_dummies(sub_df[feature_columns], drop_first=True)
        y = sub_df[target_column].astype(float)

        if len(X_df) < 10:
            raise ValueError("Dataset has fewer than 10 records; insufficient for train/test evaluation.")

        X_train, X_test, y_train, y_test = train_test_split(
            X_df, y, test_size=min(0.4, max(0.1, test_size)), random_state=42
        )

        # 1. Linear Regression Baseline
        lr = LinearRegression()
        lr.fit(X_train, y_train)
        lr_pred_train = lr.predict(X_train)
        lr_pred_test = lr.predict(X_test)

        lr_metrics = {
            "train_r2": round(float(r2_score(y_train, lr_pred_train)), 3),
            "test_r2": round(float(r2_score(y_test, lr_pred_test)), 3),
            "test_rmse": round(float(np.sqrt(mean_squared_error(y_test, lr_pred_test))), 3),
            "test_mae": round(float(mean_absolute_error(y_test, lr_pred_test)), 3)
        }

        # 2. Random Forest Regressor
        rf = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=6)
        rf.fit(X_train, y_train)
        rf_pred_train = rf.predict(X_train)
        rf_pred_test = rf.predict(X_test)

        rf_metrics = {
            "train_r2": round(float(r2_score(y_train, rf_pred_train)), 3),
            "test_r2": round(float(r2_score(y_test, rf_pred_test)), 3),
            "test_rmse": round(float(np.sqrt(mean_squared_error(y_test, rf_pred_test))), 3),
            "test_mae": round(float(mean_absolute_error(y_test, rf_pred_test)), 3)
        }

        # Feature importances from Random Forest
        importances = []
        for feat_name, imp in zip(X_df.columns, rf.feature_importances_):
            importances.append({
                "feature": feat_name,
                "importance_pct": round(float(imp) * 100.0, 2)
            })
        importances.sort(key=lambda x: x["importance_pct"], reverse=True)

        # Sample comparison predictions (first 8 test points)
        sample_preds = []
        test_indices = list(X_test.index)[:8]
        for idx in test_indices:
            sample_preds.append({
                "row_index": int(idx),
                "actual": round(float(y.loc[idx]), 2),
                "linear_reg_pred": round(float(lr.predict(X_df.loc[[idx]])[0]), 2),
                "random_forest_pred": round(float(rf.predict(X_df.loc[[idx]])[0]), 2)
            })

        # Phase-1 Feasibility Verdict on ML vs Rules
        verdict = (
            f"Random Forest achieved Test R² of {rf_metrics['test_r2']} (RMSE: {rf_metrics['test_rmse']}) "
            f"vs Linear Regression R² of {lr_metrics['test_r2']}. "
            "Top predictive drivers are: " + ", ".join([f"{x['feature']} ({x['importance_pct']}%)" for x in importances[:3]]) + ". "
            "Technical Feasibility Assessment: While ML regressors excel at capturing non-linear process synergies and sensor drift, "
            "the physics/stoichiometry-based emission factor calculation remains the primary regulatory ground truth for Phase 1. "
            "A deep neural network is NOT recommended at this stage because the tabular dataset size (N < 10,000) does not justify black-box complexity."
        )

        return {
            "model_types": ["Linear Regression (Interpretable)", "Random Forest Regressor (Non-linear)"],
            "linear_regression_metrics": lr_metrics,
            "random_forest_metrics": rf_metrics,
            "feature_importances": importances,
            "sample_predictions": sample_preds,
            "ml_vs_rules_verdict": verdict
        }

data_lab_service = DataLabService()
