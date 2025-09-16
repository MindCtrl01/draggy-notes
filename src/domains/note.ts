export interface Note {
  id: string;
  content: string;
  color: string;
  isDisplayed: boolean;
  position: {
    x: number;
    y: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type NoteColor = string; // Hex color code