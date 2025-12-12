
import React, { useEffect, useState } from 'react';
import { SavedSession } from '../types';
import { getHistory, deleteSession, clearHistory } from '../services/storage';
import { Clock, MessageSquare, FileText, Trash2, X, ChevronRight, History } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: SavedSession) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onSelectSession }) => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSessions(getHistory());
    }
  }, [isOpen]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all history?")) {
      clearHistory();
      setSessions([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <History className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg">Your History</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No saved sessions found.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer transition-all shadow-sm"
              >
                <div className="flex items-start gap-4 overflow-hidden">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${session.type === 'advisor' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                    {session.type === 'advisor' ? <FileText className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <h4 className="font-semibold text-slate-800 truncate pr-4">{session.title}</h4>
                    <p className="text-xs text-slate-500 truncate">{session.preview}</p>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {new Date(session.timestamp).toLocaleDateString()} • {new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleDelete(e, session.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {sessions.length > 0 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 font-medium px-2">
              Clear All History
            </button>
            <span className="text-xs text-slate-400">Sessions are saved locally</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryModal;
