
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { API_BASE_URL } from "../config/api";
import { startLiveStream, stopLiveStream, getLiveActivity } from "../services/liveApi";
import { resetLogsOnly } from "../services/analysisApi"; 

export default function LiveMonitorPage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamId, setStreamId] = useState(Date.now()); // Used to force refresh video
  const [sourceType, setSourceType] = useState("0");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Filter States
  const [filterName, setFilterName] = useState("");
  const [startTime, setStartTime] = useState(""); 
  const [endTime, setEndTime] = useState("");     

  const videoContainerRef = useRef(null);


  const fetchLogs = async () => {
    try {
      const latestLogs = await getLiveActivity();
      checkForNewAlerts(latestLogs, logs);
      setLogs(latestLogs);
    } catch (e) {
      console.error("Polling error", e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let interval;
    if (isStreaming) {
      interval = setInterval(fetchLogs, 2000);
    }
    return () => clearInterval(interval);
  }, [isStreaming, logs]);


  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const nameMatch = log.name.toLowerCase().includes(filterName.toLowerCase().trim());
      
      let timeMatch = true;
      if (startTime) {
        if (log.start_time < (startTime + ":00")) timeMatch = false;
      }
      if (endTime) {
        if (log.start_time > (endTime + ":00")) timeMatch = false;
      }
      return nameMatch && timeMatch;
    });
  }, [logs, filterName, startTime, endTime]);

  const checkForNewAlerts = (newLogs, oldLogs) => {
    if (newLogs.length > 0 && oldLogs.length > 0) {
      const latest = newLogs[0];
      const oldLatest = oldLogs.find(l => l.name === latest.name && l.start_time === latest.start_time);
      if (!oldLatest || (latest.detection_count > oldLatest.detection_count + 5)) {
        addNotification(`🔔 Detected: ${latest.name}`);
      }
    }
  };

  const addNotification = (msg) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

 
  const handleStart = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const src = sourceType === "0" ? "0" : remoteUrl;
      await startLiveStream(src);
      
  
      setStreamId(Date.now()); 
      setIsStreaming(true);
      addNotification("🚀 System Started");
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      
      setIsStreaming(false);
      
      
      await stopLiveStream();
      addNotification("🛑 System Stopped");
    } catch (e) { 
      console.error(e); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = async () => {
    if(!confirm("⚠️ Are you sure? This will delete ALL activity logs permanently.")) return;
    try {
        await resetLogsOnly();
        setLogs([]); 
        addNotification("🗑️ History Deleted");
    } catch (e) {
        alert("Delete failed");
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => alert(err.message));
    } else {
      document.exitFullscreen();
    }
  };

  const clearFilters = () => {
    setFilterName("");
    setStartTime("");
    setEndTime("");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* --- TOP BAR: CONTROLS --- */}
      <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <select 
            className="bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            disabled={isStreaming}
          >
            <option value="0">📸 Local Webcam</option>
            <option value="url">🌐 Remote URL (RTSP)</option>
          </select>
          {sourceType === "url" && (
            <input 
              type="text" placeholder="rtsp://..." 
              className="bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 w-64"
              value={remoteUrl} onChange={(e) => setRemoteUrl(e.target.value)}
              disabled={isStreaming}
            />
          )}
        </div>

        <div className="flex gap-3">
          {!isStreaming ? (
            <button 
                onClick={handleStart} 
                disabled={isLoading}
                className={`flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {isLoading ? "⏳ Starting..." : "▶ Start Monitor"}
            </button>
          ) : (
            <button 
                onClick={handleStop} 
                disabled={isLoading}
                className={`flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {isLoading ? "⏳ Stopping..." : "⏹ Stop Monitor"}
            </button>
          )}
        </div>
      </div>

      {/* --- VIDEO FEED --- */}
      <div ref={videoContainerRef} className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 group" style={{ minHeight: "480px" }}>
        {isStreaming ? (
          // The ?t= timestamp forces the browser to ignore cache and load fresh stream
          <img 
            key={streamId}
            src={`${API_BASE_URL}/live/video_feed?t=${streamId}`} 
            alt="Live Feed" 
            className="w-full h-full object-contain mx-auto"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 flex-col gap-2">
            <span className="text-4xl">🎥</span>
            <p>Camera is Offline</p>
            <p className="text-xs text-gray-700">Click Start to Resume</p>
          </div>
        )}
        
        {/* Notifications Overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
          {notifications.map((n) => (
            <div key={n.id} className="bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-lg border-l-4 border-green-500 shadow-xl animate-slideIn">
              {n.msg}
            </div>
          ))}
        </div>

        {/* Status & Fullscreen */}
        <div className="absolute top-4 left-4">
           {isStreaming ? <span className="bg-red-600 text-white text-xs px-2 py-1 rounded animate-pulse">● LIVE</span> : <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded">● OFFLINE</span>}
        </div>
        {isStreaming && (
            <button onClick={toggleFullScreen} className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-full text-white transition-all opacity-0 group-hover:opacity-100" title="Toggle Fullscreen">⛶</button>
        )}
      </div>

      {/* --- FILTERS & TABLE --- */}
      <div className="bg-gray-800/40 rounded-2xl border border-gray-700/50 p-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
            <div>
                <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                  📡 Real-Time Detections <span className="text-xs font-normal text-gray-500">(Today)</span>
                </h3>
            </div>
            
            {/* SEARCH & FILTERS */}
            <div className="flex flex-wrap gap-3 items-center">
                <input 
                    type="text" placeholder="Search Name..." 
                    className="bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm w-40 focus:border-blue-500 outline-none"
                    value={filterName} onChange={(e) => setFilterName(e.target.value)}
                />
                <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-700 rounded-lg px-2 py-1">
                    <span className="text-xs text-gray-500">Time:</span>
                    <input 
                        type="time" 
                        className="bg-transparent text-white text-sm outline-none"
                        value={startTime} onChange={(e) => setStartTime(e.target.value)}
                    />
                    <span className="text-gray-500">-</span>
                    <input 
                        type="time" 
                        className="bg-transparent text-white text-sm outline-none"
                        value={endTime} onChange={(e) => setEndTime(e.target.value)}
                    />
                </div>

                {(filterName || startTime || endTime) && (
                    <button onClick={clearFilters} className="text-gray-400 hover:text-white text-xs underline">
                        Clear Filters
                    </button>
                )}
                
                <button 
                    onClick={handleDeleteHistory}
                    className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-400 rounded-lg text-sm transition-colors ml-2"
                    title="Clear All History"
                >
                    🗑️ Clear History
                </button>
            </div>
        </div>
        
        {/* TABLE */}
        <div className="overflow-x-auto rounded-xl border border-gray-700 max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-gray-800 text-gray-200 uppercase text-xs font-semibold sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">First Seen</th>
                        <th className="px-6 py-3">Last Seen</th>
                        <th className="px-6 py-3">Duration</th>
                        <th className="px-6 py-3 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 bg-gray-900/30">
                    {filteredLogs.map((log, i) => (
                        <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-3 font-medium text-white flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                {log.name}
                            </td>
                            <td className="px-6 py-3">{log.start_time}</td>
                            <td className="px-6 py-3 text-emerald-400">{log.end_time}</td>
                            <td className="px-6 py-3">{log.duration}</td>
                            <td className="px-6 py-3 text-center">
                                <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 px-2 py-1 rounded text-xs">
                                    Active
                                </span>
                            </td>
                        </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-gray-600">
                                {logs.length === 0 ? "Waiting for activity..." : "No matches found."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}