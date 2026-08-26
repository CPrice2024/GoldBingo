import {
  Promotion,
} from "./promotion.model";

import {
  CreatePromotionInput,
  UpdatePromotionInput,
} from "./promotion.types";


export const createPromotion =
  async (
    data: CreatePromotionInput
  ) => {
    return Promotion.create({
      ...data,

      placement:
        "player_sidebar",
    });
  };


export const findAdminPromotions =
  async () => {
    return Promotion.find({
      placement:
        "player_sidebar",
    }).sort({
      order: 1,
      createdAt: -1,
    });
  };


export const findActivePromotions =
  async () => {
    return Promotion.find({
      placement:
        "player_sidebar",

      active: true,
    })
      .select(
        "title image link order active"
      )
      .sort({
        order: 1,
        createdAt: -1,
      });
  };


export const updatePromotionById =
  async (
    id: string,
    data: UpdatePromotionInput
  ) => {
    return Promotion.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true,
      }
    );
  };


export const deletePromotionById =
  async (id: string) => {
    return Promotion.findByIdAndDelete(
      id
    );
  };