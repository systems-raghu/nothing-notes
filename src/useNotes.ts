import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './lib/firebase';
import { Note } from './types';

export function useNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', userId),
      // order query requires composite index if not standard, but let's sort locally or create index
      // Using just where and sorting locally to avoid missing index errors initially.
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toMillis() || Date.now(),
        updatedAt: doc.data().updatedAt?.toMillis() || Date.now(),
      })) as Note[];
      
      // Sort locally descending by updatedAt
      fetchedNotes.sort((a, b) => b.updatedAt - a.updatedAt);
      
      setNotes(fetchedNotes);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notes');
    });

    return () => unsubscribe();
  }, [userId]);

  const addNote = async (title: string, content: string, category: string = '') => {
    if (!userId) return null;
    const path = 'notes';
    try {
      const newRef = doc(collection(db, path));
      await setDoc(newRef, {
        title,
        content,
        category,
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateNote = async (id: string, data: Partial<Note>) => {
    if (!userId) return;
    const path = 'notes';
    try {
      const noteRef = doc(db, path, id);
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      // prevent immutable fields from being included in diff
      delete updateData.userId;
      delete updateData.createdAt;
      delete updateData.id;
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      await updateDoc(noteRef, updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteNoteItem = async (id: string) => {
    if (!userId) return;
    const path = 'notes';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return { notes, loading, addNote, updateNote, deleteNoteItem };
}
