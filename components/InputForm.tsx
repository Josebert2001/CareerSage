/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useRef } from 'react';
import { FileData } from '../types';
import { Send, Paperclip, X, FileText } from 'lucide-react';

interface InputFormProps {
  onSubmit: (text: string, files: FileData[]) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FileData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      newFiles.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data url prefix (e.g. "data:image/png;base64,")
          const base64Data = base64String.split(',')[1];
          
          setFiles(prev => [...prev, {
            name: file.name,
            mimeType: file.type,
            data: base64Data
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;
    onSubmit(text, files);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-4 md:p-6 space-y-4">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tell me about yourself... (e.g., 'I'm an SS3 student in Lagos. I love fixing phones but my parents want me to study Law. I'm worried about tuition fees.')"
              className="w-full min-h-[150px] p-4 text-base md:text-lg text-slate-700 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none transition-all"
              disabled={isLoading}
            />
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-sm text-slate-600 animate-fadeIn">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.pdf,.doc,.docx,image/*"
                multiple
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors text-sm font-medium"
              >
                <Paperclip className="w-4 h-4" />
                <span>Attach Transcripts/CV</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || (!text.trim() && files.length === 0)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full font-semibold shadow-lg shadow-emerald-600/20 transition-all transform hover:scale-105 active:scale-95"
            >
              <span>{isLoading ? 'Analyzing...' : 'Get Guidance'}</span>
              {!isLoading && <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
          CareerSage provides guidance, not guarantees. Your data is processed securely by AI.
        </div>
      </div>
    </form>
  );
};

export default InputForm;