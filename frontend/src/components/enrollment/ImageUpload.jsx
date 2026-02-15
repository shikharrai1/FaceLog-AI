import { useState } from "react";
import { enrollImage } from "../../services/enrollmentApi";
import EnrollmentResults from "./EnrollmentResults";

export default function ImageUpload() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = [".jpg", ".jpeg", ".png"];
    const isValid = allowed.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!isValid) {
      setError("Please select a valid image (JPG, JPEG, PNG).");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await enrollImage(file);
      
      const normalizedResult = {
        status: "success",
        total_images: response.length,
        enrolled: response.filter((r) => r.status === "enrolled").length,
        failed: response.filter((r) => r.status !== "enrolled").length,
        results: response,
      };

      setResult(normalizedResult);
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
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
          Single Enrollment
        </h2>
        <p className="text-gray-300 text-sm">
          Upload a high-quality portrait for immediate database entry.
        </p>
      </div>

      {/* --- CUSTOM DROP ZONE (High Contrast) --- */}
      <div className="relative group">
        <input
          type="file"
          id="single-upload"
          accept=".jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="single-upload"
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
            ${
              loading
                ? "border-blue-500 bg-blue-900/20 animate-pulse"
                : "border-blue-400/30 bg-gray-800/80 hover:bg-gray-800 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(96,165,250,0.2)]"
            }
          `}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-200 font-medium text-lg">Analyzing Face...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center p-4">
              <div className="p-4 bg-gray-700 rounded-full group-hover:bg-blue-600 transition-colors">
                 <svg className="w-8 h-8 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <span className="block text-lg font-bold text-white group-hover:text-blue-300">Click to Upload Image</span>
                <span className="block text-sm text-gray-400 mt-1">Supports JPG, JPEG, PNG</span>
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