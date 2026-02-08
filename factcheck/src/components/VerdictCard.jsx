import React from "react";
import "../App.css";

const VerdictCard = ({ results }) => {
  const verdict = results.verdict || "Unclear";

  // force numbers + convert to %
  const confidence = Number(results.confidence || 0) * 100;
  const verifiable = Number(results.verifiable || 0) * 100;
  const trustScore = Number(results.trustScore || 0) * 100;

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case "True":
        return "#0f0";
      case "False":
        return "#f00";
      case "Developing":
        return "#ff0";
      default:
        return "#0ff";
    }
  };

  return (
    <div className="card verdict-card">
      <h3 style={{ color: getVerdictColor(verdict) }}>
        Verdict: {verdict}
      </h3>

      {/* Confidence */}
      <div className="progress-bar">
        <label>Confidence</label>
        <div className="bar-bg">
          <div
            className="bar-fill"
            style={{
              "--bar-width": `${confidence}%`,
              background: "#0ff"
            }}
          ></div>
        </div>
        <span>{confidence.toFixed(0)}%</span>
      </div>

      {/* Verifiable */}
      <div className="progress-bar">
        <label>Verifiable</label>
        <div className="bar-bg">
          <div
            className="bar-fill"
            style={{
              "--bar-width": `${verifiable}%`,
              background: "#08f"
            }}
          ></div>
        </div>
        <span>{verifiable.toFixed(0)}%</span>
      </div>

      {/* Trust */}
      <div className="progress-bar">
        <label>Trust Score</label>
        <div className="bar-bg">
          <div
            className="bar-fill"
            style={{
              "--bar-width": `${trustScore}%`,
              background: "#0f0"
            }}
          ></div>
        </div>
        <span>{trustScore.toFixed(0)}%</span>
      </div>
    </div>
  );
};

export default VerdictCard;
