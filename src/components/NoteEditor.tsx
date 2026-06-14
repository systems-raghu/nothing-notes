import React, { useState, useEffect, useRef } from 'react';
import { Note } from '../types';
import { NothingButton } from './NothingButton';
import { DrawingCanvas } from './DrawingCanvas';
import { FocusableParagraph } from './FocusableParagraph';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Edit2, Eye, PenTool, X, PanelLeftClose, PanelLeft, Menu, ArrowLeft, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NoteEditorProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onClose: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isTasksOpen?: boolean;
  onToggleTasks?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onUpdate, onClose, isSidebarOpen, onToggleSidebar, isTasksOpen, onToggleTasks }) => {
  const [isReadMode, setIsReadMode] = useState(true);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [annotations, setAnnotations] = useState(note.annotations);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setAnnotations(note.annotations);
    setIsReadMode(note.title !== '' || note.content !== '');
    setScrollProgress(0);
  }, [note.id]);

  useEffect(() => {
    if (isReadMode) {
      const interval = setInterval(() => {
        setFocusSeconds(s => s + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setFocusSeconds(0);
    }
  }, [isReadMode, note.id]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // Calculate progress as a percentage
    const progress = scrollHeight > clientHeight 
      ? (scrollTop / (scrollHeight - clientHeight)) * 100 
      : 100;
    
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSave = () => {
    onUpdate(note.id, {
      title,
      content,
      annotations
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full bg-ntg-black border-l border-ntg-gray/30 overflow-hidden relative"
    >
      <div className="flex items-center justify-between p-4 border-b border-ntg-gray/30 shrink-0 z-20 bg-ntg-black">
        <div className="flex items-center space-x-2">
          {/* Sidebar Toggle for Desktop */}
          <NothingButton 
            variant="icon" 
            onClick={onToggleSidebar}
            title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="hidden md:flex items-center justify-center"
          >
            {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
          </NothingButton>

          {/* Simple back button for Mobile */}
          <NothingButton 
            variant="icon" 
            onClick={onClose}
            title="Back to notes"
            className="md:hidden flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </NothingButton>

          <div className="w-px h-6 bg-ntg-gray/30 mx-1 hidden md:block" />

          <NothingButton 
            variant="ghost" 
            onClick={() => setIsReadMode(!isReadMode)}
            className="flex items-center gap-2"
          >
            {isReadMode ? <><Edit2 size={16}/> Edit</> : <><Eye size={16}/> Read</>}
          </NothingButton>
          
          {isReadMode && (
             <NothingButton 
              variant={isAnnotating ? "secondary" : "ghost"} 
              onClick={() => setIsAnnotating(!isAnnotating)}
              className="flex items-center gap-2"
            >
              <PenTool size={16}/> Annotate
            </NothingButton>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
           {!isReadMode && (
             <NothingButton variant="ghost" onClick={handleSave} className="mr-2">
               Save Draft
             </NothingButton>
           )}
           {onToggleTasks && (
             <NothingButton 
               variant={isTasksOpen ? "secondary" : "icon"} 
               onClick={onToggleTasks}
               title="Toggle Tasks"
               className={`flex items-center justify-center ${isTasksOpen ? 'px-3' : 'p-2'}`}
             >
               <CheckSquare size={18} className={isTasksOpen ? 'mr-2' : ''} />
               {isTasksOpen && "Tasks"}
             </NothingButton>
           )}
           <NothingButton variant="icon" onClick={onClose} className="hidden md:flex">
             <X size={20} />
           </NothingButton>
        </div>
      </div>

      {isReadMode && (
        <div className="w-full h-1 bg-ntg-gray/10 shrink-0 relative overflow-hidden z-20">
          <motion.div 
            className="absolute top-0 bottom-0 left-0 bg-ntg-red"
            style={{ width: `${scrollProgress}%` }}
            layout
          />
        </div>
      )}

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative p-6 md:p-12 scroll-smooth"
      >
        {!isReadMode ? (
          <div className="max-w-3xl mx-auto h-full flex flex-col">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              placeholder="NOTE TITLE."
              className="w-full bg-transparent text-4xl md:text-5xl font-ndot uppercase tracking-widest text-ntg-white border-none outline-none mb-8 placeholder-ntg-gray"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleSave}
              placeholder="Start typing in markdown..."
              className="flex-1 w-full bg-transparent text-lg font-serif text-ntg-light/90 border-none outline-none resize-none placeholder-ntg-gray leading-relaxed"
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto relative min-h-full read-mode-container">
            <h1 className="text-4xl md:text-5xl font-ndot uppercase tracking-widest text-ntg-white mb-4">
              {title || "UNTITLED."}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-12 text-ntg-gray font-ndot text-sm tracking-widest uppercase opacity-80">
              <span className="bg-ntg-gray/10 px-2 py-1 rounded">{wordCount} WORDS</span>
              <span className="bg-ntg-gray/10 px-2 py-1 rounded">{readingTime} MIN READ</span>
            </div>
            
            <div className="markdown-body">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <FocusableParagraph>{children}</FocusableParagraph>
                }}
              >
                {content}
              </ReactMarkdown>
            </div>

            {(isAnnotating || annotations) && (
              <DrawingCanvas 
                initialData={annotations} 
                readOnly={!isAnnotating}
                onChange={(data) => {
                  setAnnotations(data);
                  onUpdate(note.id, { annotations: data });
                }}
              />
            )}

            {isReadMode && scrollProgress > 95 && wordCount > 50 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-24 pt-12 pb-12 w-full mx-auto relative"
              >
                {/* Decorative border line instead of full border */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-px bg-gradient-to-r from-transparent via-ntg-gray/50 to-transparent" />
                
                <div className="relative overflow-hidden w-full bg-ntg-white/5 backdrop-blur-xl border border-ntg-white/10 p-8 sm:p-12 rounded-2xl text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] z-10">
                  {/* Subtle animated gradient glow */}
                  <motion.div 
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-ntg-gray/10 rounded-full mix-blend-screen filter blur-[60px] pointer-events-none"
                  />
                  <p className="relative font-ndot text-ntg-red text-2xl tracking-widest uppercase z-10">
                    End of Note
                  </p>
                  <p className="relative font-serif text-ntg-white/80 mt-4 text-lg z-10">
                    Great focus. Keep up the momentum.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Floating Focus Timer */}
      <AnimatePresence>
        {isReadMode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-20 md:top-auto md:bottom-6 right-6 z-50 flex items-center gap-3 overflow-hidden rounded-lg p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] pointer-events-none border border-ntg-white/10"
          >
            {/* Dark/Glassy base */}
            <div className="absolute inset-0 bg-ntg-black/40 backdrop-blur-xl" />
            
            {/* Animated minimalist glass glow */}
            <motion.div 
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-ntg-red/5 rounded-full filter blur-[20px] mix-blend-screen"
            />
            
            <div className="w-2 h-2 rounded-full bg-ntg-red animate-pulse relative z-10" />
            <span className="font-ndot tracking-widest text-ntg-white pt-1 relative z-10 text-lg">
              {formatTime(focusSeconds)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
