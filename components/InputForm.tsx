
import React, { useState, useRef } from 'react';
import { FileData } from '../types';
import { Send, X, FileText, Camera, Sparkles } from 'lucide-react';

interface InputFormProps {
  onSubmit: (text: string, files: FileData[]) => void;
  isLoading: boolean;
}

const SUGGESTIONS = [
  "I'm in SS3, good at Art but parents want Law.",
  "I studied Biochemistry but want to switch to Tech.",
  "I need a job that pays while I study.",
  "I failed JAMB and don't know what to do next.",
];

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FileData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: FileData[] = [];
      let processedCount = 0;
      // Explicitly cast to File[] to handle 'unknown' inference from Array.from on FileList
      const fileList = Array.from(e.target.files) as File[];

      fileList.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const base64String = (event.target.result as string).split(',')[1];
            newFiles.push({
              name: file.name,
              mimeType: file.type,
              data: base64String
            });
          }
          processedCount++;
          // Only update state once all files are processed to avoid race conditions
          if (processedCount === fileList.length) {
            setFiles(prev => [...prev, ...newFiles]);
          }
        };
        reader.readAsDataURL(file);
      });
      
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setText(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;
    onSubmit(text, files);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-4">
      <div className="relative bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-shadow focus-within:shadow-xl focus-within:border-emerald-500/50">
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tell me your story... (e.g., your current level, favorite subjects, financial situation, and dreams)"
          className="w-full min-h-[160px] p-6 text-slate-700 placeholder-slate-400 focus:outline-none text-lg resize-none bg-transparent"
          disabled={isLoading}
        />

        {/* File Preview Area */}
        {files.length > 0 && (
          <div className="px-6 pb-2 flex flex-wrap gap-2">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-sm text-slate-700 animate-fadeIn">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-slate-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors text-sm font-medium group"
              disabled={isLoading}
              title="Upload transcript, results, or notes"
            >
              <Camera className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
              <span className="hidden sm:inline">Add Photo/Doc <span className="text-slate-400 font-normal">(Optional)</span></span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!text.trim() && files.length === 0)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition-all transform hover:scale-105 active:scale-95 ${
              isLoading || (!text.trim() && files.length === 0)
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">Analyzing...</span>
            ) : (
              <>
                <span>Start Journey</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Suggestion Chips */}
      {!isLoading && !text && (
        <div className="flex flex-wrap gap-2 justify-center animate-fadeIn px-2">
          {SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-emerald-500" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </form>
  );
};

export default InputForm;
