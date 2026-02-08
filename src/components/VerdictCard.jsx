import React from "react";
import "../App.css";

const VerdictCard = ({ results }) => {
  const { verdict, confidence, verifiable, trustScore } = results;

  const safe = (v) => {
    const n = Number(v);
    if (isNaN(n)) return 0;
    return n > 100 ? 100 : n < 0 ? 0 : n; // clamp 0–100
  };

  const conf = safe(confidence);
  const ver = safe(verifiable);
  const trust = safe(trustScore);

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case "True": return "#0f0";
      case "False": return "#f00";
      case "Developing": return "#ff0";
      default: return "#0ff";
    }
  };

  return (
    <div className="card verdict-card">
      <h3 style={{ color: getVerdictColor(verdict) }}>Verdict: {verdict}</h3>

      {/* Confidence */}
      <div className="progress-bar">
        <label>Confidence</label>
        <div className="bar-bg">
          <div
            className="bar-fill"
            style={{ width: `${conf}%`, background: "#0ff" }}
          />
        </div>
        <span>{conf}%</span>
      </div>

      {/* Verifiable */}
      <div className="progress-bar">
        <label>Verifiable</label>
        <div className="bar-bg">
          <div
            className="bar-fill"
            style={{ width: `${ver}%`, background: "#08f" }}
          />
        </div>
        <span>{ver}%</span>
      </div>

      {/* Trust */}
      <div className="progress-bar">
        <label>Trust Score</label>
        <div className="bar-bg">
          <div
            className="bar-fill"
            style={{ width: `${trust}%`, background: "#0f0" }}
          />
        </div>
        <span>{trust}%</span>
      </div>
    </div>
  );
};

export default VerdictCard;
