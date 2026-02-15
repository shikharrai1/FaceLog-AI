// import ImageUpload from "../components/enrollment/ImageUpload";
// import FolderUpload from "../components/enrollment/FolderUpload";

// export default function EnrollmentPage() {
//   return (
//     <div className="space-y-12 animate-fadeIn">
//       {/* 1. Single Image Upload */}
//       <section>
//         <ImageUpload />
//       </section>

//       {/* Divider */}
//       <div className="relative flex items-center py-4">
//         <div className="flex-grow border-t border-gray-700"></div>
//         <span className="flex-shrink-0 mx-4 text-gray-500 text-sm uppercase tracking-widest font-semibold">
//           OR BATCH PROCESSING
//         </span>
//         <div className="flex-grow border-t border-gray-700"></div>
//       </div>

//       {/* 2. Folder Upload */}
//       <section>
//         <FolderUpload />
//       </section>
//     </div>
//   );
// }

import ImageUpload from "../components/enrollment/ImageUpload";
import FolderUpload from "../components/enrollment/FolderUpload";
import WebcamEnroll from "../components/enrollment/WebcamEnroll";

export default function EnrollmentPage() {
  return (
    <div className="space-y-12 animate-fadeIn">
      {/* 1. Live Webcam Enrollment */}
      <section>
        <WebcamEnroll />
      </section>

      {/* Divider */}
      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-gray-700"></div>
        <span className="flex-shrink-0 mx-4 text-gray-500 text-sm uppercase tracking-widest font-semibold">
          OR UPLOAD MANUALLY
        </span>
        <div className="flex-grow border-t border-gray-700"></div>
      </div>

      {/* 2. Single Image Upload */}
      <section>
        <ImageUpload />
      </section>

      {/* Divider */}
      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-gray-700"></div>
        <span className="flex-shrink-0 mx-4 text-gray-500 text-sm uppercase tracking-widest font-semibold">
          OR BATCH PROCESSING
        </span>
        <div className="flex-grow border-t border-gray-700"></div>
      </div>

      {/* 3. Folder Upload */}
      <section>
        <FolderUpload />
      </section>
    </div>
  );
}