import { useState, useEffect } from 'react';
import { Note } from './types';

const STORAGE_KEY = 'nothing_notes_data';

export function useNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotes(parsed);
      } catch (e) {
        console.error("Failed to parse notes from localStorage", e);
        setNotes([]);
      }
    }
    setLoading(false);
  }, []);

  // Sync to localStorage whenever notes change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, loading]);

  const addNote = async (title: string, content: string, category: string = '') => {
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      content,
      category,
      userId: 'local-user',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setNotes(prev => [newNote, ...prev]);
    return newNote.id;
  };

  const updateNote = async (id: string, data: Partial<Note>) => {
    setNotes(prev => prev.map(note => {
      if (note.id === id) {
        return {
          ...note,
          ...data,
          updatedAt: Date.now(),
        };
      }
      return note;
    }));
  };

  const deleteNoteItem = async (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  return { notes, loading, addNote, updateNote, deleteNoteItem };
}
