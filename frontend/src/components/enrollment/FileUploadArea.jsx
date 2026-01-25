// import { useState, useRef } from "react";

// export default function FileUploadArea({ onFilesSelected, loading }) {
//   const [dragActive, setDragActive] = useState(false);
//   const inputRef = useRef(null);

//   const handleDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") {
//       setDragActive(true);
//     } else if (e.type === "dragleave") {
//       setDragActive(false);
//     }
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       onFilesSelected(e.dataTransfer.files[0]);
//     }
//   };

//   const handleChange = (e) => {
//     e.preventDefault();
//     if (e.target.files && e.target.files[0]) {
//       onFilesSelected(e.target.files[0]);
//     }
//   };

//   const onButtonClick = () => {
//     inputRef.current.click();
//   };

//   return (
//     <div
//       className={`relative w-full max-w-2xl mx-auto h-64 rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out flex flex-col items-center justify-center
//         ${dragActive 
//           ? "border-blue-400 bg-blue-900/20 scale-[1.02]" 
//           : "border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800"
//         }
//         ${loading ? "opacity-50 pointer-events-none cursor-wait" : "cursor-pointer"}
//       `}
//       onDragEnter={handleDrag}
//       onDragLeave={handleDrag}
//       onDragOver={handleDrag}
//       onDrop={handleDrop}
//       onClick={onButtonClick}
//     >
//       <input
//         ref={inputRef}
//         type="file"
//         className="hidden"
//         multiple={false}
//         accept=".jpg,.jpeg,.png,.zip"
//         onChange={handleChange}
//       />

//       {loading ? (
//         <div className="flex flex-col items-center animate-pulse">
//           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
//           <p className="text-blue-300 font-medium">Processing files...</p>
//         </div>
//       ) : (
//         <div className="text-center p-6 space-y-3">
//           <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-2">
//             <span className="text-3xl">📂</span>
//           </div>
//           <div>
//             <p className="text-xl font-bold text-white">
//               Drag & Drop or Click to Upload
//             </p>
//             <p className="text-sm text-gray-400 mt-2">
//               Supports <span className="text-blue-400 font-mono">.zip</span> folders or single images
//             </p>
//           </div>
//         </div>
//       )}

//       {dragActive && (
//         <div className="absolute inset-0 w-full h-full bg-blue-500/10 rounded-3xl backdrop-blur-sm flex items-center justify-center pointer-events-none">
//           <p className="text-blue-200 font-bold text-lg">Drop files here!</p>
//         </div>
//       )}
//     </div>
//   );
// }