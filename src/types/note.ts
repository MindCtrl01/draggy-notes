export interface Note {
  id: string;
  content: string;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';
  position: {
    x: number;
    y: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type NoteColor = Note['color'];