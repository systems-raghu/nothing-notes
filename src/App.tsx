import React, { useState, useEffect } from 'react';
import { useNotes } from './useNotes';
import { loginWithGoogle, logout, auth } from './lib/firebase';
import { NoteEditor } from './components/NoteEditor';
import { NothingButton } from './components/NothingButton';
import { GoogleTasks } from './components/GoogleTasks';
import { CameraWidget } from './components/CameraWidget';
import { Plus, LogOut, FileText, Trash2, PanelLeftClose, PanelLeft, Menu, CheckSquare, Sun, Moon, ScanFace } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export default function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => setUser(u));
  }, []);

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (isLightMode) {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [isLightMode]);

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
  };

  const { notes, loading, addNote, updateNote, deleteNoteItem } = useNotes(user?.uid);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    if (!selectedNoteId) {
      setIsSidebarOpen(true);
    }
  }, [selectedNoteId]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleToggleTasks = () => {
    setIsTasksOpen(!isTasksOpen);
  };

  const handleAddNote = async () => {
    const id = await addNote("", "", "general");
    if (id) {
      setSelectedNoteId(id);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    }
  };

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ntg-black p-4 relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, var(--theme-white) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center z-10"
        >
          <h1 className="text-6xl md:text-8xl font-ndot uppercase tracking-[0.2em] text-ntg-white mb-6">
            Nothi<br className="md:hidden"/>ng<br/><span className="text-ntg-gray">Notes.</span>
          </h1>
          <p className="text-xl font-serif text-ntg-light mt-4 mb-12 max-w-md mx-auto leading-relaxed">
            A minimalist space for your thoughts. Monochromatic, distraction-free, perfectly synced.
          </p>
          <NothingButton 
            onClick={async () => {
              try {
                await loginWithGoogle()
              } catch (err: any) {
                if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
                  console.error('Login error:', err);
                }
              }
            }} 
            className="text-lg px-8 py-4"
          >
            Sign In with Google
          </NothingButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ntg-black text-ntg-white flex overflow-hidden relative w-full">
      {/* Sidebar List */}
      <div 
        className={`flex flex-col bg-ntg-black z-40 transition-all duration-300 ease-in-out overflow-hidden border-ntg-gray/30 absolute md:relative h-full
          ${isSidebarOpen ? 'w-full md:w-96 border-r translate-x-0' : 'w-0 border-r-0 -translate-x-full md:translate-x-0'}
          ${selectedNoteId && isSidebarOpen ? 'md:flex' : 'flex'}
        `}
      >
        <div className="flex flex-col h-screen w-full md:w-96 min-w-[100vw] md:min-w-[24rem]">
          <div className="p-6 border-b border-ntg-gray/30 flex justify-between items-center">
            <h1 className="text-2xl font-ndot tracking-widest uppercase truncate shrink-0">Notes.</h1>
            <div className="flex gap-2 shrink-0">
              <NothingButton variant="icon" onClick={() => setIsCameraOpen(!isCameraOpen)} title="Face & Gestures">
                <ScanFace size={18} />
              </NothingButton>
              <NothingButton variant="icon" onClick={toggleTheme} title="Toggle Theme">
                {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
              </NothingButton>
              <NothingButton variant="icon" onClick={handleToggleTasks} title="Tasks" className="md:hidden">
                <CheckSquare size={18} />
              </NothingButton>
              <NothingButton variant="icon" onClick={() => logout()} title="Logout">
                <LogOut size={18} />
              </NothingButton>
            </div>
          </div>
          
          <div className="p-4 shrink-0">
            <NothingButton className="w-full flex justify-center items-center gap-2" onClick={handleAddNote}>
              <Plus size={18} /> New Note
            </NothingButton>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {loading ? (
              <div className="text-center p-8 font-ndot text-ntg-gray animate-pulse">LOADING...</div>
            ) : notes.length === 0 ? (
              <div className="text-center p-8 font-serif text-ntg-gray italic">No notes yet. Add one above.</div>
            ) : (
              <AnimatePresence>
                {notes.map(note => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      if (window.innerWidth < 768) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`p-4 cursor-pointer border transition-colors group relative ${selectedNoteId === note.id ? 'border-ntg-white bg-ntg-gray/10' : 'border-ntg-gray/20 hover:border-ntg-gray/60'}`}
                  >
                    <h3 className="font-ndot text-lg truncate mb-1 pr-8">
                      {note.title || "UNTITLED NOTE"}
                    </h3>
                    <div className="flex justify-between items-end mt-2">
                      <p className="font-serif text-sm text-ntg-gray truncate flex-1 pr-2">
                        {note.content.substring(0, 50) || "Empty note..."}
                      </p>
                      <span className="font-ndot text-xs text-ntg-gray whitespace-nowrap">
                        {format(new Date(note.updatedAt), 'MMM dd')}
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNoteItem(note.id);
                        if (selectedNoteId === note.id) setSelectedNoteId(null);
                      }}
                      className="absolute top-4 right-4 text-ntg-gray opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-ntg-red transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className={`flex-1 min-w-0 h-screen transition-all ${(!selectedNoteId && isSidebarOpen) ? 'hidden md:flex items-center justify-center' : 'block'}`}>
        <AnimatePresence mode="wait">
          {selectedNoteId && selectedNote ? (
            <NoteEditor 
              key={selectedNote.id}
              note={selectedNote} 
              onUpdate={updateNote}
              onClose={() => setSelectedNoteId(null)}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              isTasksOpen={isTasksOpen}
              onToggleTasks={handleToggleTasks}
            />
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="hidden md:flex flex-col items-center justify-center text-ntg-gray h-full w-full"
            >
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="font-ndot tracking-widest uppercase">SELECT OR CREATE A NOTE.</p>
              
              {!isTasksOpen && (
                <NothingButton onClick={handleToggleTasks} variant="ghost" className="mt-8 flex gap-2">
                  <CheckSquare size={18} /> Open Tasks
                </NothingButton>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Sidebar - Tasks */}
      <div 
        className={`flex flex-col bg-ntg-black z-50 md:z-30 transition-all duration-300 ease-in-out border-ntg-gray/30 absolute md:relative right-0 h-full overflow-hidden
          ${isTasksOpen ? 'w-full md:w-96 border-l translate-x-0' : 'w-0 border-l-0 translate-x-full md:translate-x-0 md:w-0'}
        `}
      >
        <div className="flex flex-col h-screen w-full md:w-96 min-w-[100vw] md:min-w-[24rem]">
          <GoogleTasks onToggle={() => setIsTasksOpen(false)} />
        </div>
      </div>
      <CameraWidget active={isCameraOpen} onClose={() => setIsCameraOpen(false)} />
    </div>
  );
}
