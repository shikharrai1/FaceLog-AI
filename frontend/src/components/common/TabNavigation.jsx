import React from 'react';

export default function TabNavigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'enroll', label: 'Enrollment', icon: '👤' },
    { id: 'live', label: 'Live Monitor', icon: '📡' },
    { id: 'recognize', label: 'Recognition', icon: '🎥' },
    { id: 'manage', label: 'Gallery & Data', icon: '💾' },
  ];

  return (
    <div className="flex justify-center mb-10">
      <div className="flex space-x-1 bg-gray-800/50 backdrop-blur-md p-1.5 rounded-xl border border-gray-700/50 shadow-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2
                ${isActive 
                  ? 'text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
                }
              `}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg -z-10" />
              )}
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}