export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  annotations?: string; // JSON string of strokes
}
