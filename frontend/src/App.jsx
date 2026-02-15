// import { useState } from "react";
// import TabNavigation from "./components/common/TabNavigation";
// import EnrollmentPage from "./pages/EnrollmentPage";
// import RecognitionPage from "./pages/RecognitionPage";
// import GalleryPage from "./pages/GalleryPage";
// import LiveMonitorPage from "./pages/LiveMonitorPage";

// function App() {
//   const [activeTab, setActiveTab] = useState("enroll");

//   return (
//     <div className="min-h-screen bg-slate-900 text-white px-4 py-8 md:px-8 font-sans transition-colors duration-500">
//       <div className="max-w-6xl mx-auto">
        
   
//         <div className="text-center mb-12 space-y-3">
//           <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 pb-2 drop-shadow-2xl">
//             FaceLog-AI
//           </h1>
//           <p className="text-slate-400 text-lg font-light tracking-wide">
//             Next-Gen Identity Enrollment & Recognition System
//           </p>
//         </div>

      
//         <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

     
//         <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden min-h-[600px] transition-all duration-300">
          
//           <div className={`h-1 w-full bg-gradient-to-r transition-all duration-500
//             ${activeTab === 'enroll' ? 'from-blue-500 via-cyan-500 to-emerald-500' : ''}
//             ${activeTab === 'recognize' ? 'from-purple-500 via-pink-500 to-red-500' : ''}
//             ${activeTab === 'manage' ? 'from-amber-500 via-orange-500 to-yellow-500' : ''}
//           `}></div>

//           <div className="p-6 md:p-10">
      
//             <div className={activeTab === "enroll" ? "block" : "hidden"}>
//               <EnrollmentPage />
//             </div>

//             <div className={activeTab === "recognize" ? "block" : "hidden"}>
//               <RecognitionPage />
//             </div>

//             {activeTab === "manage" && <GalleryPage />}

//           </div>
//         </div>

//         <div className="text-center mt-12 text-slate-600 text-sm">
//           Powered by InsightFace & FastAPI
//         </div>

//       </div>
//     </div>
//   );
// }

// export default App;
import { useState } from "react";
import TabNavigation from "./components/common/TabNavigation";
import EnrollmentPage from "./pages/EnrollmentPage";
import RecognitionPage from "./pages/RecognitionPage";
import GalleryPage from "./pages/GalleryPage";
import LiveMonitorPage from "./pages/LiveMonitorPage"; // <--- Import This

function App() {
  const [activeTab, setActiveTab] = useState("enroll");

  return (
    <div className="min-h-screen bg-slate-900 text-white px-4 py-8 md:px-8 font-sans transition-colors duration-500">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 pb-2 drop-shadow-2xl">
            FaceLog-AI
          </h1>
          <p className="text-slate-400 text-lg font-light tracking-wide">
            Next-Gen Identity Enrollment & Recognition System
          </p>
        </div>

        {/* Navigation */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Card */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden min-h-[600px] transition-all duration-300">
          
          {/* Gradient Line */}
          <div className={`h-1 w-full bg-gradient-to-r transition-all duration-500
            ${activeTab === 'enroll' ? 'from-blue-500 via-cyan-500 to-emerald-500' : ''}
            ${activeTab === 'live' ? 'from-red-500 via-orange-500 to-yellow-500' : ''}  {/* <--- Add Color for Live */}
            ${activeTab === 'recognize' ? 'from-purple-500 via-pink-500 to-red-500' : ''}
            ${activeTab === 'manage' ? 'from-amber-500 via-orange-500 to-yellow-500' : ''}
          `}></div>

          <div className="p-6 md:p-10">
      
            <div className={activeTab === "enroll" ? "block" : "hidden"}>
              <EnrollmentPage />
            </div>

            {/* --- ADD THIS BLOCK --- */}
            <div className={activeTab === "live" ? "block" : "hidden"}>
              <LiveMonitorPage />
            </div>
            {/* ---------------------- */}

            <div className={activeTab === "recognize" ? "block" : "hidden"}>
              <RecognitionPage />
            </div>

            {activeTab === "manage" && <GalleryPage />}

          </div>
        </div>

        <div className="text-center mt-12 text-slate-600 text-sm">
          Powered by InsightFace & FastAPI
        </div>

      </div>
    </div>
  );
}

export default App;