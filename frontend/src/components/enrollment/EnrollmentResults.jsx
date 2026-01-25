import { useState, useEffect } from "react";
import { enrollImage } from "../../services/enrollmentApi"; 

export default function EnrollmentResults({ data }) {
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  if (!localData || !localData.results) return null;

  const friendlyReason = (reason) => {
    if (!reason) return "Unknown issue";
    const r = reason.toLowerCase();
    if (r.includes("no face")) return "No clear face detected.";
    if (r.includes("too small")) return "Face is too small (needs >40px).";
    if (r.includes("confidence")) return "Face unclear or blurry.";
    if (r.includes("format")) return "Unsupported file format.";
    return reason;
  };

  // --- HELPER: DETERMINE STATUS BADGE ---
  const getStatusBadge = () => {
    // Case 1: All Good
    if (localData.failed === 0) {
      return (
        <span className="px-2 py-0.5 rounded text-sm font-bold bg-green-500/20 text-green-300 border border-green-500/30">
          SUCCESS
        </span>
      );
    } 
    // Case 2: Total Failure (New Logic)
    else if (localData.enrolled === 0) {
      return (
        <span className="px-2 py-0.5 rounded text-sm font-bold bg-red-500/20 text-red-300 border border-red-500/30">
          FAILED
        </span>
      );
    } 
    // Case 3: Mixed
    else {
      return (
        <span className="px-2 py-0.5 rounded text-sm font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          PARTIAL SUCCESS
        </span>
      );
    }
  };

  const handleRetry = async (file, index) => {
    try {
      const responseArray = await enrollImage(file);
      const newResult = responseArray[0];

      setLocalData((prev) => {
        const updatedResults = [...prev.results];
        updatedResults[index] = newResult;

        const enrolledCount = updatedResults.filter(r => r.status === "enrolled").length;
        const failedCount = updatedResults.length - enrolledCount;

        return {
          ...prev,
          enrolled: enrolledCount,
          failed: failedCount,
          results: updatedResults,
        };
      });
    } catch (err) {
      alert(`System Error: ${err.message}`);
    }
  };

  return (
    <div className="mt-10 w-full animate-fadeIn">
      {/* ---------- SUMMARY CARD ---------- */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">Enrollment Report</h3>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-gray-400 text-sm">Status:</span>
               {/* Call the helper function here */}
               {getStatusBadge()}
            </div>
          </div>
          
          <div className="flex gap-4 md:gap-8 text-sm font-medium bg-gray-900/50 p-4 rounded-xl border border-gray-700">
            <div className="flex flex-col items-center">
              <span className="text-gray-400 text-xs uppercase tracking-wider">Total</span>
              <span className="text-white text-xl font-bold">{localData.total_images}</span>
            </div>
            <div className="w-px h-10 bg-gray-700"></div>
            <div className="flex flex-col items-center">
              <span className="text-green-400 text-xs uppercase tracking-wider">Enrolled</span>
              <span className="text-green-300 text-xl font-bold">{localData.enrolled}</span>
            </div>
            <div className="w-px h-10 bg-gray-700"></div>
            <div className="flex flex-col items-center">
              <span className="text-red-400 text-xs uppercase tracking-wider">Failed</span>
              <span className="text-red-300 text-xl font-bold">{localData.failed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- RESULTS GRID ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {localData.results.map((item, idx) => {
          const success = item.status === "enrolled";

          return (
            <div
              key={idx}
              className={`relative rounded-2xl p-6 border-2 transition-all duration-300 flex flex-col justify-between ${
                success
                  ? "border-green-500/30 bg-gray-800 shadow-[0_4px_20px_rgba(34,197,94,0.1)]"
                  : "border-red-500/30 bg-gray-800 shadow-[0_4px_20px_rgba(239,68,68,0.1)]"
              }`}
            >
              {/* Header: Filename & Badge */}
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 flex-1">
                   <p className="font-mono text-xs text-white break-all leading-relaxed">
                     {item.filename}
                   </p>
                </div>
                
                {success && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-green-500 text-gray-900 px-2 py-1 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse">
                    Active
                  </span>
                )}
              </div>

              {success ? (
                /* SUCCESS UI */
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1 bg-green-500/20 rounded-full">
                       <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <span className="text-lg font-bold text-white">Enrolled</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Face Quality Score</span>
                      <span>{(item.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-full rounded-full" 
                        style={{ width: `${item.confidence * 100}%` }} 
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                /* FAILED UI + RETRY */
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-red-500/20 rounded-full">
                       <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </div>
                    <span className="text-lg font-bold text-white">Failed</span>
                  </div>
                  
                  <p className="text-red-300 text-sm mb-6 pl-1">
                    {friendlyReason(item.reason)}
                  </p>

                  <label className="flex items-center justify-center w-full gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-200 text-sm font-bold rounded-xl cursor-pointer border border-red-500/30 transition-all hover:scale-[1.02] active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    RETRY UPLOAD
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png"
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleRetry(file, idx);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}