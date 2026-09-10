export type InfoCategory =
  | "general"
  | "promotion"
  | "maintenance"
  | "game"
  | "important";

export interface CreateInfoInput {
  title: string;
  content: string;
  category?: InfoCategory;
  isPublished?: boolean;
}

export interface UpdateInfoInput {
  title?: string;
  content?: string;
  category?: InfoCategory;
}