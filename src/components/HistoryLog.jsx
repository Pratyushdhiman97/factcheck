import React, { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { History } from "lucide-react";
import "../App.css";

const HistoryLog = ({ refreshTrigger }) => {
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!error && data) {
        setHistory(data);
      }
    } catch (e) {
      console.warn("History could not be loaded. Ensure the 'verifications' table exists.");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  if (history.length === 0) return null;

  return (
    <div className="card fact-log-card w-full max-w-3xl mx-auto mt-8">
      <div className="flex items-center gap-2 mb-4">
        <History size={20} className="text-cyan-400" />
        <h3 className="text-lg font-bold text-cyan-400">Recent Verifications</h3>
      </div>
      <ul className="fact-list space-y-3">
        {history.map((item) => (
          <li key={item.id} className="fact-item flex flex-col items-start gap-1 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex justify-between w-full">
              <span className="fact-claim font-medium text-white">{item.query}</span>
              <span className="text-xs text-gray-500">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-cyan-400 font-bold">Verdict: {item.verdict}</span>
              <span className="text-purple-400">Confidence: {item.confidence}%</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HistoryLog;