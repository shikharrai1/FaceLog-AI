
import { useState } from "react";
import { recognizeVideo } from "../services/recognitionApi";

export default function RecognitionPage() {
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // UX Validation
    const allowedTypes = ["video/mp4", "video/x-msvideo", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid video file (MP4, AVI, MOV).");
      return;
    }

    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const response = await recognizeVideo(file);
      
      // Fix Caching: Append timestamp to force browser to reload the new video
      setVideoUrl(`${response.video_url}?t=${Date.now()}`);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white flex justify-center items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          </div>
          Video Intelligence
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto">
          Upload CCTV footage or recorded video. The AI will track enrolled faces and log events automatically.
        </p>
      </div>

      {/* --- VIDEO PLAYER OR UPLOAD ZONE --- */}
      <div className="max-w-4xl mx-auto">
        
        {videoUrl ? (
          /* RESULT STATE */
          <div className="bg-black/50 border border-purple-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)]">
            <div className="p-4 bg-purple-900/20 border-b border-purple-500/20 flex justify-between items-center">
              <span className="text-purple-200 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Processed Output
              </span>
              <button 
                onClick={() => setVideoUrl(null)}
                className="text-xs text-purple-300 hover:text-white underline"
              >
                Upload New Video
              </button>
            </div>
            
            <video 
              src={videoUrl} 
              controls 
              className="w-full aspect-video"
            />
          </div>

        ) : (
          /* UPLOAD STATE */
          <div className="relative group">
            <input
              type="file"
              id="video-upload"
              accept=".mp4,.avi,.mov"
              onChange={handleVideoUpload}
              className="hidden"
              disabled={loading}
            />
            <label
              htmlFor="video-upload"
              className={`flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300
                ${loading
                  ? "border-purple-500 bg-purple-900/10 cursor-wait"
                  : "border-purple-500/30 bg-gray-800/50 hover:bg-gray-800 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                }
              `}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-6">
                  {/* Spinner */}
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-purple-900/50 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xl font-bold text-white">Processing Video...</p>
                    <p className="text-sm text-purple-300">Detecting faces & logging events</p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-4">
                  <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto group-hover:bg-purple-600 transition-colors duration-300">
                    <svg className="w-10 h-10 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                      Click to Upload Video
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Supports MP4, AVI, MOV (Max 100MB recommended)
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-950/50 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 animate-slideUp">
            <svg className="w-6 h-6 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}