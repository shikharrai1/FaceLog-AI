import { useState, useRef, useEffect } from "react";
import { enrollWebcam } from "../../services/enrollmentApi";
import EnrollmentResults from "./EnrollmentResults";

export default function WebcamEnroll() {
  const [name, setName] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // Keep a direct reference to the stream

  // --- Stop Camera (Defined first for cleanup) ---
  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  // --- Start Camera ---
  const startCamera = async () => {
    // Clean up any stale sessions first
    stopCamera();
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: "user" 
        } 
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for metadata to ensure video dimensions are ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.error("Auto-play failed:", e));
          setIsCameraOpen(true);
        };
      }
    } catch (err) {
      console.error("Detailed Camera Error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera access denied. Please check your browser settings and Brave Shields.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError("Camera hardware is busy. Please close other apps or restart your system.");
      } else {
        setError(`Camera Error: ${err.message}`);
      }
    }
  };

  // --- Cleanup on component unmount ---
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // --- Capture Countdown Logic ---
  const handleCaptureProcess = () => {
    if (!name.trim()) {
      setError("Please enter 'EmployeeID_Name' before capturing.");
      return;
    }
    setCountdown(3);
    setError(null);
    setResult(null);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      captureImage();
      setCountdown(null);
    }
  }, [countdown]);

  const captureImage = async () => {
    setLoading(true);
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      
      const base64Image = canvas.toDataURL("image/jpeg", 0.9);
      const response = await enrollWebcam(base64Image, name);

      setResult({
        status: "success",
        total_images: response.length,
        enrolled: response.filter((r) => r.status === "enrolled").length,
        failed: response.filter((r) => r.status !== "enrolled").length,
        results: response,
      });
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
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          Live Webcam Enrollment
        </h2>
        <p className="text-gray-300 text-sm">Capture a clear, well-lit photo for the database.</p>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Identifier (e.g. 101_JohnDoe)</label>
          <input 
            type="text" 
            placeholder="Enter ID and Name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all shadow-inner"
          />
        </div>

        <div className="relative aspect-video bg-gray-950 rounded-xl overflow-hidden border-2 border-gray-700 shadow-inner">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className={`w-full h-full object-cover transform scale-x-[-1] ${!isCameraOpen ? 'hidden' : ''}`} 
          />
          <canvas ref={canvasRef} className="hidden" />

          {!isCameraOpen && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900/80">
              <div className="p-4 bg-gray-800 rounded-full text-purple-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <button onClick={startCamera} className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg">
                Initialize Camera
              </button>
            </div>
          )}

          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all">
              <span className="text-9xl font-black text-white drop-shadow-2xl animate-pulse">{countdown}</span>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/70 backdrop-blur-md">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white font-bold tracking-widest uppercase text-sm">Processing Enrollment...</span>
              </div>
            </div>
          )}
        </div>

        {isCameraOpen && !loading && (
          <div className="flex gap-4 animate-fadeIn">
            <button 
              onClick={handleCaptureProcess}
              disabled={countdown !== null}
              className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 disabled:opacity-50"
            >
              TAKE PHOTO
            </button>
            <button onClick={stopCamera} className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all">
              OFF
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 animate-shake">
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      {result && <EnrollmentResults data={result} />}
    </div>
  );
}