// GoogleTasks export was duplicated, just fixing the file
import React, { useState, useEffect } from 'react';
import { getAccessToken, loginWithGoogle } from '../lib/firebase';
import { NothingButton } from './NothingButton';
import { CheckSquare, Square, Trash2, Plus, LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Task {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  notes?: string;
  updated: string;
}

export const GoogleTasks: React.FC<{onToggle?: () => void}> = ({onToggle}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskListId, setTaskListId] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) {
        setNeedsAuth(true);
        setLoading(false);
        return;
      }
      setNeedsAuth(false);

      const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!listsRes.ok) {
        if (listsRes.status === 401 || listsRes.status === 403) {
           setNeedsAuth(true);
        }
        setLoading(false);
        return;
      }

      const listsData = await listsRes.json();
      
      if (!listsData.items || listsData.items.length === 0) {
        setLoading(false);
        return;
      }

      const defaultListId = listsData.items[0].id;
      setTaskListId(defaultListId);

      const tasksRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${defaultListId}/tasks?showCompleted=true&showHidden=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tasksData = await tasksRes.json();
      
      if (tasksData.items) {
        setTasks(tasksData.items);
      }
      setNeedsAuth(false);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleConnect = async () => {
    try {
      await loginWithGoogle();
      await fetchTasks();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        console.error("Login failed", err);
      }
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (!taskListId) return;
    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      const token = await getAccessToken();
      await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...task, status: newStatus })
      });
    } catch (err) {
      console.error("Failed to update task", err);
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !taskListId) return;

    try {
      const token = await getAccessToken();
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTaskTitle })
      });
      
      if (!res.ok) {
        throw new Error("Failed to add task");
      }
      
      const newTask = await res.json();
      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
    } catch (err) {
      console.error("Failed to add task", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!taskListId) return;
    
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(tasks.filter(t => t.id !== taskId));

    try {
      const token = await getAccessToken();
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch (err) {
      console.error("Failed to delete task", err);
      setTasks(previousTasks);
    }
  };

  return (
    <div className="flex flex-col h-full bg-ntg-black overflow-hidden border-l border-ntg-gray/30 w-full shrink-0">
      <div className="p-6 border-b border-ntg-gray/30 flex justify-between items-center bg-ntg-black relative z-10 shrink-0">
        <h2 className="text-2xl font-ndot tracking-widest uppercase">Tasks.</h2>
        {onToggle && (
          <NothingButton variant="icon" onClick={onToggle} title="Close tasks">
            <X size={20} />
          </NothingButton>
        )}
      </div>

      {needsAuth ? (
        <div className="flex flex-col items-center justify-center p-8 flex-1">
          <p className="font-serif text-ntg-gray text-center mb-6">Connection to Google Tasks is required.</p>
          <NothingButton onClick={handleConnect} className="w-full justify-center">
            Connect Google Tasks
          </NothingButton>
        </div>
      ) : (
        <>
          <div className="p-4 border-b border-ntg-gray/30 bg-ntg-black relative z-10 shrink-0">
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="ADD NEW TASK..."
                className="flex-1 min-w-0 bg-transparent text-ntg-white border border-ntg-gray/30 p-2 font-ndot text-sm tracking-wide uppercase outline-none focus:border-ntg-white transition-colors"
              />
              <NothingButton type="submit" variant="ghost" className="px-3 shrink-0" title="Add Task">
                <Plus size={18} />
              </NothingButton>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 relative z-0">
            {loading ? (
               <div className="text-center p-8 font-ndot text-ntg-gray animate-pulse">LOADING TASKS...</div>
            ) : (!tasks || tasks.length === 0) ? (
              <div className="text-center p-8 font-serif text-ntg-gray italic">No tasks. You're all caught up.</div>
            ) : (
              <AnimatePresence>
                {tasks.map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 border transition-colors group flex items-start gap-4 ${task.status === 'completed' ? 'border-transparent bg-ntg-gray/5 opacity-50' : 'border-ntg-gray/20 hover:border-ntg-gray/60'}`}
                  >
                    <button 
                      onClick={() => handleToggleTask(task)}
                      className="mt-1 text-ntg-gray hover:text-ntg-white transition-colors shrink-0"
                    >
                      {task.status === 'completed' ? <CheckSquare size={18} className="text-ntg-white" /> : <Square size={18} />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-ndot text-base tracking-wide leading-snug break-words ${task.status === 'completed' ? 'line-through text-ntg-gray' : 'text-ntg-white'}`}>
                        {task.title}
                      </h3>
                      {task.notes && (
                        <p className={`font-serif text-xs mt-1 break-words ${task.status === 'completed' ? 'text-ntg-gray/50' : 'text-ntg-gray'}`}>
                          {task.notes}
                        </p>
                      )}
                    </div>

                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-ntg-gray opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-ntg-red transition-all shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </>
      )}
    </div>
  );
};
