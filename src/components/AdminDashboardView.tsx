import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AdminDashboardView: React.FC = () => {
  const [isResolving, setIsResolving] = useState(false);
  const [resolveResult, setResolveResult] = useState<string | null>(null);

  const handleResolveExpiredPredictions = async () => {
    setIsResolving(true);
    setResolveResult(null);

    try {
      const { data, error } = await supabase.rpc("resolve_expired_predictions");

      if (error) {
        setResolveResult(`Error: ${error.message}`);
      } else {
        setResolveResult(`Successfully resolved ${data} expired predictions`);
      }
    } catch (err) {
      setResolveResult(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Prediction Management</h2>

        <div className="space-y-4">
          <p className="text-gray-600">
            Resolve expired predictions that have passed their expiration date
            without manual resolution.
          </p>

          <button
            onClick={handleResolveExpiredPredictions}
            disabled={isResolving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isResolving ? "Resolving..." : "Resolve Expired Predictions"}
          </button>

          {resolveResult && (
            <div
              className={`p-3 rounded ${resolveResult.startsWith("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
            >
              {resolveResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
