export interface CreatePromotionInput {
  title?: string;
  image: string;
  link?: string;
  order?: number;
  active?: boolean;
}

export interface UpdatePromotionInput {
  title?: string;
  image?: string;
  link?: string;
  order?: number;
  active?: boolean;
}