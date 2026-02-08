import React, { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { History } from "lucide-react";
import "../App.css";

const HistoryLog = ({ refreshTrigger }) => {
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!error && data) {
      setHistory(data);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  if (history.length === 0) return null;

  return (
    <div className="card fact-log-card">
      <div className="flex items-center gap-2 mb-4">
        <History size={20} className="text-cyan-400" />
        <h3>Recent Verifications</h3>
      </div>
      <ul className="fact-list">
        {history.map((item) => (
          <li key={item.id} className="fact-item flex flex-col items-start gap-1">
            <div className="flex justify-between w-full">
              <span className="fact-claim font-bold">{item.query}</span>
              <span className="text-xs opacity-50">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-cyan-400">Verdict: {item.verdict}</span>
              <span className="text-purple-400">Confidence: {item.confidence}%</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HistoryLog;