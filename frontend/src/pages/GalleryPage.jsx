import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { 
  getStats, 
  getEnrolledPersons, 
  getLogs, 
  resetLogsOnly, 
  nukeSystem 
} from "../services/analysisApi";

export default function GalleryPage() {
  const [stats, setStats] = useState({ total_users: 0, total_events: 0, storage_count: 0 });
  const [persons, setPersons] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Query/Filter States
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("gallery"); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'logs') {
        fetchLogs();
    }
  }, [searchName, searchDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await getStats();
      setStats(s);
      const p = await getEnrolledPersons();
      setPersons(p);
      await fetchLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    let formattedDate = "";
    if (searchDate) {
        const parts = searchDate.split("-"); 
        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    try {
        const l = await getLogs(searchName, formattedDate);
        setLogs(l);
    } catch (e) {
        console.error("Log fetch error", e);
    }
  }

  // ---  EXPORT TO CSV ---
  const downloadCSV = () => {
    if (logs.length === 0) return alert("No logs to export!");
    
    //  CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Date,Start Time,End Time,Duration,Detections\n";

    // Add Rows
    logs.forEach(row => {
        csvContent += `${row.name},${row.date},${row.start_time},${row.end_time},${row.duration},${row.detection_count}\n`;
    });

    // Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "facelog_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CLEAR FILTERS ---
  const clearFilters = () => {
    setSearchName("");
    setSearchDate("");
  };

  const handleResetLogs = async () => {
    if(!confirm("Are you sure? This will delete ALL event history.")) return;
    await resetLogsOnly();
    loadData();
  };

  const handleNuke = async () => {
    if(!confirm("WARNING: This will delete ALL Enrolled Faces and Logs. System will be empty. Continue?")) return;
    await nukeSystem();
    loadData();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex items-center gap-4 shadow-lg">
          <div className="p-4 bg-blue-500/20 rounded-xl text-blue-400 text-2xl">👥</div>
          <div>
            <p className="text-gray-400 text-sm">Enrolled Identities</p>
            <p className="text-3xl font-bold text-white">{stats.total_users}</p>
          </div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex items-center gap-4 shadow-lg">
          <div className="p-4 bg-purple-500/20 rounded-xl text-purple-400 text-2xl">⚡</div>
          <div>
            <p className="text-gray-400 text-sm">Total Events Detected</p>
            <p className="text-3xl font-bold text-white">{stats.total_events}</p>
          </div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex items-center gap-4 shadow-lg">
          <div className="p-4 bg-emerald-500/20 rounded-xl text-emerald-400 text-2xl">💾</div>
          <div>
            <p className="text-gray-400 text-sm">Gallery Files</p>
            <p className="text-3xl font-bold text-white">{stats.storage_count}</p>
          </div>
        </div>
      </div>

      {/* SUB NAVIGATION */}
      <div className="flex border-b border-gray-700 space-x-6">
        <button 
          onClick={() => setActiveSubTab("gallery")}
          className={`pb-3 text-sm font-medium transition-colors ${activeSubTab === "gallery" ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-400 hover:text-white"}`}
        >
          🖼️ Face Gallery
        </button>
        <button 
          onClick={() => setActiveSubTab("logs")}
          className={`pb-3 text-sm font-medium transition-colors ${activeSubTab === "logs" ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-400 hover:text-white"}`}
        >
          📜 Activity Logs
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="min-h-[400px]">
        
        {/* VIEW 1: GALLERY */}
        {activeSubTab === "gallery" && (
            <div>
                {persons.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">No enrolled faces found.</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {persons.map((p, idx) => (
                            <div key={idx} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-amber-500/50 transition-all hover:scale-105 shadow-xl">
                                <div className="aspect-square bg-gray-900 relative">
                                    <img 
                                        src={`${API_BASE_URL}${p.face_image_path}`} 
                                        alt={p.name} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {e.target.src = "https://via.placeholder.com/150?text=No+Img"}} 
                                    />
                                    <div className="absolute top-2 right-2 bg-black/60 text-xs px-2 py-0.5 rounded text-gray-300 backdrop-blur-sm">
                                        ID: {p.person_id.slice(0,4)}
                                    </div>
                                </div>
                                <div className="p-3 text-center">
                                    <h3 className="font-bold text-white truncate">{p.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{p.name_raw}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* VIEW 2: LOGS & QUERY */}
        {activeSubTab === "logs" && (
            <div className="space-y-6">
                
                {/* QUERY CONTROLS */}
                <div className="flex flex-col md:flex-row gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Search by Name</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="e.g. Shikhar..." 
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-3 pr-10 py-2 text-white focus:outline-none focus:border-amber-500"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />
                            {/* CLEAR BUTTON INSIDE INPUT */}
                            {searchName && (
                                <button 
                                    onClick={() => setSearchName("")}
                                    className="absolute right-2 top-2 text-gray-500 hover:text-white"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Filter by Date</label>
                        <div className="flex gap-2">
                             <input 
                                type="date" 
                                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                                value={searchDate}
                                onChange={(e) => setSearchDate(e.target.value)}
                            />
                             {/* CLEAR DATE BUTTON */}
                             {searchDate && (
                                <button onClick={() => setSearchDate("")} className="text-gray-500 hover:text-white">
                                    ✕
                                </button>
                             )}
                        </div>
                    </div>
                    
                    <div className="flex items-end gap-2">
                         <button onClick={loadData} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors flex items-center gap-2">
                            🔄 Refresh
                         </button>
                         <button onClick={downloadCSV} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white transition-colors flex items-center gap-2">
                            📥 Export CSV
                         </button>
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto rounded-xl border border-gray-700">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-800 text-gray-200 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Time (Start - End)</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4 text-center">Detections</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 bg-gray-900/30">
                            {logs.map((log, i) => (
                                <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{log.name}</td>
                                    <td className="px-6 py-4">{log.date}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{log.start_time} <span className="text-gray-600">→</span> {log.end_time}</td>
                                    <td className="px-6 py-4 text-amber-400">{log.duration}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">{log.detection_count}</span>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No logs found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

      </div>

      {/* DANGER ZONE */}
      <div className="mt-12 pt-8 border-t border-gray-800">
        <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
            ⚠️ Danger Zone
        </h3>
        <div className="flex gap-4">
            <button 
                onClick={handleResetLogs}
                className="px-4 py-2 bg-red-900/20 border border-red-900/50 text-red-400 hover:bg-red-900/40 rounded-lg text-sm transition-colors"
            >
                Clear Activity Logs Only
            </button>
            <button 
                onClick={handleNuke}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm shadow-lg shadow-red-900/20 transition-all hover:scale-105"
            >
                ☢️ NUKE SYSTEM (Reset All)
            </button>
        </div>
      </div>
    </div>
  );
}