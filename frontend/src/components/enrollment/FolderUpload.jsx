import { useState } from "react";
import { enrollFolder } from "../../services/enrollmentApi";
import EnrollmentResults from "./EnrollmentResults";

export default function FolderUpload() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleZipChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError("Invalid format. Please upload a .ZIP archive.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await enrollFolder(file);
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
             <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path></svg>
          </div>
          Bulk Enrollment
        </h2>
        <p className="text-gray-300 text-sm">
          Upload a <span className="text-emerald-300 font-mono bg-emerald-900/50 px-1.5 py-0.5 rounded border border-emerald-500/30">.zip</span> containing multiple face images.
        </p>
      </div>

      {/* --- CUSTOM DROP ZONE (High Contrast) --- */}
      <div className="relative group">
        <input
          type="file"
          id="folder-upload"
          accept=".zip"
          onChange={handleZipChange}
          className="hidden"
        />
        <label
          htmlFor="folder-upload"
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
            ${
              loading
                ? "border-emerald-500 bg-emerald-900/20 animate-pulse"
                : "border-emerald-400/30 bg-gray-800/80 hover:bg-gray-800 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]"
            }
          `}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-emerald-200 font-medium text-lg">Processing Batch...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center p-4">
               <div className="p-4 bg-gray-700 rounded-full group-hover:bg-emerald-600 transition-colors">
                  <svg className="w-8 h-8 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
               </div>
              <div>
                <span className="block text-lg font-bold text-white group-hover:text-emerald-300">Click to Upload ZIP Folder</span>
                <span className="block text-sm text-gray-400 mt-1">Large datasets supported</span>
              </div>
            </div>
          )}
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-950/50 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 animate-fadeIn">
          <svg className="w-6 h-6 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Results */}
      {result && <EnrollmentResults data={result} />}
    </div>
  );
}