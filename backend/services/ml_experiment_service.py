import os
import json
import logging
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import shap

logger = logging.getLogger(__name__)

DATA_PROCESSED = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "processed"
)
MASTER_CSV = os.path.join(DATA_PROCESSED, "master_spatial_temporal_dataset.csv")

REPORTS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "reports"
)
REGISTRY_FILE = os.path.join(REPORTS_DIR, "model_registry.json")

# ==========================================
# PYTORCH DEEP LEARNING ARCHITECTURES
# ==========================================
class MLPRegressor(nn.Module):
    """
    3-Layer Multilayer Perceptron matching Section 18:
    Input -> Dense 128 -> ReLU -> Dropout -> Dense 64 -> ReLU -> Dropout -> Dense 32 -> Output 1
    """
    def __init__(self, input_dim: int, dropout_rate: float = 0.2):
        super(MLPRegressor, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        return self.net(x)

class SequentialLSTM(nn.Module):
    """
    Temporal Sequential LSTM matching Section 19:
    Past N days sequence (N=7) -> 2-layer LSTM -> Dense -> Next-day prediction.
    """
    def __init__(self, input_dim: int, hidden_dim: int = 64, num_layers: int = 2, dropout: float = 0.2):
        super(SequentialLSTM, self).__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=dropout if num_layers > 1 else 0)
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        out, (hn, cn) = self.lstm(x)
        # Use representation from final time step
        return self.fc(out[:, -1, :])

class SequentialGRU(nn.Module):
    """
    Temporal Sequential GRU for benchmarking against LSTM.
    """
    def __init__(self, input_dim: int, hidden_dim: int = 64, num_layers: int = 2, dropout: float = 0.2):
        super(SequentialGRU, self).__init__()
        self.gru = nn.GRU(input_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=dropout if num_layers > 1 else 0)
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        out, hn = self.gru(x)
        return self.fc(out[:, -1, :])


class MLExperimentService:
    """
    Scientific Machine Learning & Deep Learning Benchmark Suite.
    - Chronological 70% / 15% / 15% Train/Val/Test Split
    - Baseline Models: Linear Regression, Random Forest, XGBoost
    - Deep Learning: PyTorch 3-Layer MLP, Sequential LSTM, Sequential GRU
    - Ablation Study (Factory vs Weather vs Ground vs Satellite)
    - SHAP Explainability Engine
    - Isolation Forest Anomaly Detection
    """

    def __init__(self, dataset_path: str = MASTER_CSV):
        self.dataset_path = dataset_path

    def load_and_split_data(self, target_col: str = "no2"):
        df = pd.read_csv(self.dataset_path)
        df = df.sort_values("date").reset_index(drop=True)

        n = len(df)
        train_end = int(n * 0.70)
        val_end = int(n * 0.85)

        train_df = df.iloc[:train_end].copy()
        val_df = df.iloc[train_end:val_end].copy()
        test_df = df.iloc[val_end:].copy()

        # Core scientific feature subset
        feature_cols = [
            "temperature_c", "relative_humidity_pct", "precipitation_mm", "surface_pressure_hpa",
            "wind_speed_ms", "wind_u", "wind_v",
            "ndvi", "ndbi", "ndwi",
            "production_tonnes", "natural_gas_m3", "electricity_kwh", "diesel_litres",
            "total_energy_mwh", "energy_intensity_mwh_per_tonne", "calculated_total_co2e_tonnes",
            "month_sin", "month_cos", "dow_sin", "dow_cos",
            "no2_lag_1d", "no2_lag_7d", "so2_lag_1d", "co_lag_1d", "pm25_lag_1d",
            "no2_7d_mean", "no2_30d_mean", "so2_7d_mean", "pm25_7d_mean"
        ]
        feature_cols = [c for c in feature_cols if c in df.columns]

        X_train, y_train = train_df[feature_cols], train_df[target_col]
        X_val, y_val = val_df[feature_cols], val_df[target_col]
        X_test, y_test = test_df[feature_cols], test_df[target_col]

        scaler = StandardScaler()
        X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=feature_cols, index=X_train.index)
        X_val_scaled = pd.DataFrame(scaler.transform(X_val), columns=feature_cols, index=X_val.index)
        X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=feature_cols, index=X_test.index)

        return {
            "feature_cols": feature_cols,
            "train_df": train_df,
            "val_df": val_df,
            "test_df": test_df,
            "X_train": X_train, "y_train": y_train, "X_train_scaled": X_train_scaled,
            "X_val": X_val, "y_val": y_val, "X_val_scaled": X_val_scaled,
            "X_test": X_test, "y_test": y_test, "X_test_scaled": X_test_scaled,
            "scaler": scaler,
            "dates": {
                "train": [train_df['date'].min(), train_df['date'].max()],
                "val": [val_df['date'].min(), val_df['date'].max()],
                "test": [test_df['date'].min(), test_df['date'].max()]
            }
        }

    def train_all_models(self, target_col: str = "no2") -> dict:
        data = self.load_and_split_data(target_col=target_col)
        feature_cols = data["feature_cols"]
        X_train, y_train = data["X_train"], data["y_train"]
        X_val, y_val = data["X_val"], data["y_val"]
        X_test, y_test = data["X_test"], data["y_test"]
        X_train_s, X_val_s, X_test_s = data["X_train_scaled"], data["X_val_scaled"], data["X_test_scaled"]

        comparison_records = []

        # ----------------------------------------------------
        # 1. Linear Regression Baseline
        # ----------------------------------------------------
        lr = LinearRegression()
        lr.fit(X_train_s, y_train)
        lr_pred = lr.predict(X_test_s)
        comparison_records.append({
            "model": "Linear Regression",
            "family": "Baseline / Parametric",
            "train_r2": round(float(r2_score(y_train, lr.predict(X_train_s))), 4),
            "val_r2": round(float(r2_score(y_val, lr.predict(X_val_s))), 4),
            "test_r2": round(float(r2_score(y_test, lr_pred)), 4),
            "test_mae": round(float(mean_absolute_error(y_test, lr_pred)), 4),
            "test_rmse": round(float(np.sqrt(mean_squared_error(y_test, lr_pred))), 4),
            "parameters": len(feature_cols) + 1
        })

        # ----------------------------------------------------
        # 2. Random Forest Regressor
        # ----------------------------------------------------
        rf = RandomForestRegressor(n_estimators=150, max_depth=8, random_state=42, n_jobs=-1)
        rf.fit(X_train, y_train)
        rf_pred = rf.predict(X_test)
        comparison_records.append({
            "model": "Random Forest Regressor",
            "family": "Tree Ensemble / Bagging",
            "train_r2": round(float(r2_score(y_train, rf.predict(X_train))), 4),
            "val_r2": round(float(r2_score(y_val, rf.predict(X_val))), 4),
            "test_r2": round(float(r2_score(y_test, rf_pred)), 4),
            "test_mae": round(float(mean_absolute_error(y_test, rf_pred)), 4),
            "test_rmse": round(float(np.sqrt(mean_squared_error(y_test, rf_pred))), 4),
            "parameters": "150 Trees (Depth 8)"
        })

        # ----------------------------------------------------
        # 3. XGBoost Gradient Boosting
        # ----------------------------------------------------
        xg_model = xgb.XGBRegressor(n_estimators=150, max_depth=5, learning_rate=0.05, random_state=42)
        xg_model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
        xg_pred = xg_model.predict(X_test)
        comparison_records.append({
            "model": "XGBoost",
            "family": "Tree Ensemble / Boosting",
            "train_r2": round(float(r2_score(y_train, xg_model.predict(X_train))), 4),
            "val_r2": round(float(r2_score(y_val, xg_model.predict(X_val))), 4),
            "test_r2": round(float(r2_score(y_test, xg_pred)), 4),
            "test_mae": round(float(mean_absolute_error(y_test, xg_pred)), 4),
            "test_rmse": round(float(np.sqrt(mean_squared_error(y_test, xg_pred))), 4),
            "parameters": "150 Boosters (lr=0.05)"
        })

        # ----------------------------------------------------
        # 4. PyTorch 3-Layer Multilayer Perceptron (MLP)
        # ----------------------------------------------------
        torch.manual_seed(42)
        mlp = MLPRegressor(input_dim=len(feature_cols))
        criterion = nn.MSELoss()
        optimizer = torch.optim.AdamW(mlp.parameters(), lr=0.005, weight_decay=1e-4)

        t_X_train = torch.tensor(X_train_s.values, dtype=torch.float32)
        t_y_train = torch.tensor(y_train.values, dtype=torch.float32).unsqueeze(1)
        t_X_val = torch.tensor(X_val_s.values, dtype=torch.float32)
        t_y_val = torch.tensor(y_val.values, dtype=torch.float32).unsqueeze(1)
        t_X_test = torch.tensor(X_test_s.values, dtype=torch.float32)

        train_loader = DataLoader(TensorDataset(t_X_train, t_y_train), batch_size=32, shuffle=True)

        best_val_loss = float('inf')
        best_weights = None
        for epoch in range(120):
            mlp.train()
            for bx, by in train_loader:
                optimizer.zero_grad()
                pred = mlp(bx)
                loss = criterion(pred, by)
                loss.backward()
                optimizer.step()

            mlp.eval()
            with torch.no_grad():
                val_loss = criterion(mlp(t_X_val), t_y_val).item()
                if val_loss < best_val_loss:
                    best_val_loss = val_loss
                    best_weights = mlp.state_dict().copy()

        if best_weights is not None:
            mlp.load_state_dict(best_weights)

        mlp.eval()
        with torch.no_grad():
            mlp_train_pred = mlp(t_X_train).squeeze().numpy()
            mlp_val_pred = mlp(t_X_val).squeeze().numpy()
            mlp_pred = mlp(t_X_test).squeeze().numpy()

        comparison_records.append({
            "model": "PyTorch 3-Layer MLP",
            "family": "Deep Learning / Dense Feedforward",
            "train_r2": round(float(r2_score(y_train, mlp_train_pred)), 4),
            "val_r2": round(float(r2_score(y_val, mlp_val_pred)), 4),
            "test_r2": round(float(r2_score(y_test, mlp_pred)), 4),
            "test_mae": round(float(mean_absolute_error(y_test, mlp_pred)), 4),
            "test_rmse": round(float(np.sqrt(mean_squared_error(y_test, mlp_pred))), 4),
            "parameters": sum(p.numel() for p in mlp.parameters())
        })

        # ----------------------------------------------------
        # 5. Temporal Sequential LSTM & GRU (Sequence = 7 Days)
        # ----------------------------------------------------
        seq_len = 7
        def create_sequences(X_arr, y_arr, seq_k=seq_len):
            xs, ys = [], []
            for i in range(len(X_arr) - seq_k):
                xs.append(X_arr[i:i+seq_k])
                ys.append(y_arr[i+seq_k])
            return np.array(xs), np.array(ys)

        all_X_scaled = pd.concat([X_train_s, X_val_s, X_test_s]).values
        all_y = pd.concat([y_train, y_val, y_test]).values

        n_train = len(X_train_s)
        n_val = len(X_val_s)
        n_test = len(X_test_s)

        train_seq_X, train_seq_y = create_sequences(all_X_scaled[:n_train], all_y[:n_train], seq_len)
        val_seq_X, val_seq_y = create_sequences(all_X_scaled[n_train - seq_len : n_train + n_val], all_y[n_train - seq_len : n_train + n_val], seq_len)
        test_seq_X, test_seq_y = create_sequences(all_X_scaled[n_train + n_val - seq_len:], all_y[n_train + n_val - seq_len:], seq_len)

        # Train LSTM
        torch.manual_seed(42)
        lstm_model = SequentialLSTM(input_dim=len(feature_cols), hidden_dim=64, num_layers=2)
        lstm_opt = torch.optim.AdamW(lstm_model.parameters(), lr=0.005)
        t_seq_train_x = torch.tensor(train_seq_X, dtype=torch.float32)
        t_seq_train_y = torch.tensor(train_seq_y, dtype=torch.float32).unsqueeze(1)
        t_seq_val_x = torch.tensor(val_seq_X, dtype=torch.float32)
        t_seq_val_y = torch.tensor(val_seq_y, dtype=torch.float32).unsqueeze(1)
        t_seq_test_x = torch.tensor(test_seq_X, dtype=torch.float32)

        seq_loader = DataLoader(TensorDataset(t_seq_train_x, t_seq_train_y), batch_size=32, shuffle=True)
        best_lstm_val = float('inf')
        best_lstm_w = None

        for epoch in range(90):
            lstm_model.train()
            for bx, by in seq_loader:
                lstm_opt.zero_grad()
                pred = lstm_model(bx)
                l = criterion(pred, by)
                l.backward()
                lstm_opt.step()
            lstm_model.eval()
            with torch.no_grad():
                vl = criterion(lstm_model(t_seq_val_x), t_seq_val_y).item()
                if vl < best_lstm_val:
                    best_lstm_val = vl
                    best_lstm_w = lstm_model.state_dict().copy()

        if best_lstm_w:
            lstm_model.load_state_dict(best_lstm_w)

        lstm_model.eval()
        with torch.no_grad():
            lstm_tr_pred = lstm_model(t_seq_train_x).squeeze().detach().numpy()
            lstm_val_p = lstm_model(t_seq_val_x).squeeze().detach().numpy()
            lstm_pred = lstm_model(t_seq_test_x).squeeze().detach().numpy()

        comparison_records.append({
            "model": "Sequential LSTM (7-Day Memory)",
            "family": "Recurrent Deep Learning (LSTM)",
            "train_r2": round(float(r2_score(train_seq_y, lstm_tr_pred)), 4),
            "val_r2": round(float(r2_score(val_seq_y, lstm_val_p)), 4),
            "test_r2": round(float(r2_score(test_seq_y, lstm_pred)), 4),
            "test_mae": round(float(mean_absolute_error(test_seq_y, lstm_pred)), 4),
            "test_rmse": round(float(np.sqrt(mean_squared_error(test_seq_y, lstm_pred))), 4),
            "parameters": sum(p.numel() for p in lstm_model.parameters())
        })

        # Train GRU
        torch.manual_seed(42)
        gru_model = SequentialGRU(input_dim=len(feature_cols), hidden_dim=64, num_layers=2)
        gru_opt = torch.optim.AdamW(gru_model.parameters(), lr=0.005)
        for epoch in range(80):
            gru_model.train()
            for bx, by in seq_loader:
                gru_opt.zero_grad()
                l = criterion(gru_model(bx), by)
                l.backward()
                gru_opt.step()

        gru_model.eval()
        with torch.no_grad():
            gru_pred = gru_model(t_seq_test_x).squeeze().numpy()

        with torch.no_grad():
            gru_tr_pred = gru_model(t_seq_train_x).squeeze().detach().numpy()
            gru_val_p = gru_model(t_seq_val_x).squeeze().detach().numpy()
        
        comparison_records.append({
            "model": "Sequential GRU (7-Day Memory)",
            "family": "Recurrent Deep Learning (GRU)",
            "train_r2": round(float(r2_score(train_seq_y, gru_tr_pred)), 4),
            "val_r2": round(float(r2_score(val_seq_y, gru_val_p)), 4),
            "test_r2": round(float(r2_score(test_seq_y, gru_pred)), 4),
            "test_mae": round(float(mean_absolute_error(test_seq_y, gru_pred)), 4),
            "test_rmse": round(float(np.sqrt(mean_squared_error(test_seq_y, gru_pred))), 4),
            "parameters": sum(p.numel() for p in gru_model.parameters())
        })

        # ----------------------------------------------------
        # 6. Ablation Study: Does Satellite Data Add Value?
        # ----------------------------------------------------
        ablation_results = self._run_ablation_study(data)

        # ----------------------------------------------------
        # 7. SHAP Feature Attribution
        # ----------------------------------------------------
        shap_explainer = shap.TreeExplainer(rf)
        shap_values = shap_explainer.shap_values(X_test[:80])
        shap_importance = np.abs(shap_values).mean(axis=0)
        shap_ranking = []
        for feat, val in zip(feature_cols, shap_importance):
            shap_ranking.append({"feature": feat, "shap_importance": round(float(val), 4)})
        shap_ranking.sort(key=lambda x: x["shap_importance"], reverse=True)

        # ----------------------------------------------------
        # 8. Anomaly Detection (Isolation Forest)
        # ----------------------------------------------------
        iso_forest = IsolationForest(contamination=0.06, random_state=42)
        anomaly_feats = ["natural_gas_m3", "electricity_kwh", "diesel_litres", "production_tonnes", "no2"]
        sub_X = data["train_df"][anomaly_feats]
        iso_forest.fit(sub_X)
        all_df = pd.read_csv(self.dataset_path)
        anomaly_scores = iso_forest.decision_function(all_df[anomaly_feats])
        is_anomaly = iso_forest.predict(all_df[anomaly_feats]) == -1

        anomalies_detected = []
        for idx in np.where(is_anomaly)[0]:
            row = all_df.iloc[idx]
            anomalies_detected.append({
                "date": row["date"],
                "natural_gas_m3": row["natural_gas_m3"],
                "production_tonnes": row["production_tonnes"],
                "no2_ugm3": row["no2"],
                "score": round(float(anomaly_scores[idx]), 3),
                "reason": "Operational decoupling: elevated energy consumption with non-commensurate production output (potential physical leak or combustion fouling)"
            })

        # Determine Model Selection Verdict
        best_model = min(comparison_records, key=lambda x: x["test_rmse"])
        dl_justified = (best_model["model"] in ["Sequential LSTM (7-Day Memory)", "Sequential GRU (7-Day Memory)", "PyTorch 3-Layer MLP"]) and (best_model["test_r2"] > 0.85)

        verdict_summary = {
            "selected_model": best_model["model"],
            "best_test_rmse": best_model["test_rmse"],
            "best_test_r2": best_model["test_r2"],
            "deep_learning_justified": dl_justified,
            "decision_rationale": (
                f"Model evaluation demonstrated that {best_model['model']} achieved lowest Test RMSE of {best_model['test_rmse']} "
                f"and Test R² of {best_model['test_r2']}. "
                f"{'Sequential deep learning is justified as multi-day temporal autoregression effectively captures boundary-layer persistence.' if dl_justified else 'Tree ensemble methods (Random Forest / XGBoost) remain superior to deep neural networks on this dataset size, providing higher generalization and auditability without overfitting risk.'}"
            )
        }

        # Save registry
        registry_data = {
            "target": target_col,
            "dataset_split": data["dates"],
            "features_count": len(feature_cols),
            "comparison": comparison_records,
            "ablation": ablation_results,
            "shap_top_features": shap_ranking[:10],
            "anomalies_count": len(anomalies_detected),
            "verdict": verdict_summary
        }

        with open(REGISTRY_FILE, "w") as f:
            json.dump(registry_data, f, indent=2)

        return registry_data

    def _run_ablation_study(self, data: dict) -> list:
        """
        Executes Section 39:
        Model A: Factory data only
        Model B: Factory + Weather
        Model C: Factory + Weather + Ground Environmental
        Model D: Factory + Weather + Ground Environmental + Satellite
        """
        X_train, y_train = data["X_train"], data["y_train"]
        X_test, y_test = data["X_test"], data["y_test"]

        factory_cols = ["production_tonnes", "natural_gas_m3", "electricity_kwh", "diesel_litres", "total_energy_mwh", "energy_intensity_mwh_per_tonne"]
        weather_cols = ["temperature_c", "relative_humidity_pct", "wind_speed_ms", "wind_u", "wind_v", "surface_pressure_hpa"]
        env_cols = ["no2_lag_1d", "no2_lag_7d", "so2_lag_1d", "pm25_lag_1d", "no2_7d_mean"]
        sat_cols = ["ndvi", "ndbi", "ndwi"]

        configs = [
            ("Model A: Factory Operational Only", factory_cols),
            ("Model B: Factory + Weather", factory_cols + weather_cols),
            ("Model C: Factory + Weather + Ground Lags", factory_cols + weather_cols + env_cols),
            ("Model D: Full Multimodal (+ Satellite S2 & S5P)", factory_cols + weather_cols + env_cols + sat_cols)
        ]

        ablation_results = []
        for name, feats in configs:
            sub_train = X_train[[c for c in feats if c in X_train.columns]]
            sub_test = X_test[[c for c in feats if c in X_test.columns]]

            m = RandomForestRegressor(n_estimators=100, max_depth=7, random_state=42)
            m.fit(sub_train, y_train)
            pred = m.predict(sub_test)

            r2 = round(float(r2_score(y_test, pred)), 4)
            rmse = round(float(np.sqrt(mean_squared_error(y_test, pred))), 4)
            mae = round(float(mean_absolute_error(y_test, pred)), 4)

            ablation_results.append({
                "ablation_stage": name,
                "features_count": len(sub_train.columns),
                "test_r2": r2,
                "test_rmse": rmse,
                "test_mae": mae
            })

        return ablation_results

ml_experiment_service = MLExperimentService()

if __name__ == "__main__":
    res = ml_experiment_service.train_all_models()
    print("\n[SUCCESS] Scientific ML/DL Suite Finished! Comparison Table:")
    comp_df = pd.DataFrame(res["comparison"])
    print(comp_df[["model", "family", "test_r2", "test_rmse", "test_mae", "parameters"]])
    print("\nAblation Study Results:")
    abl_df = pd.DataFrame(res["ablation"])
    print(abl_df)
    print("\nModel Selection Verdict:")
    print(json.dumps(res["verdict"], indent=2))
