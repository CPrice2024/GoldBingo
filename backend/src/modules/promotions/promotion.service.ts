import {
  CreatePromotionInput,
  UpdatePromotionInput,
} from "./promotion.types";

import {
  createPromotion,
  deletePromotionById,
  findActivePromotions,
  findAdminPromotions,
  updatePromotionById,
} from "./promotion.repository";


const MAX_IMAGE_SIZE =
  1024 * 1024;


/* =========================
   IMAGE VALIDATION
========================= */

const validateImage = (
  image: string
) => {
  if (!image) {
    throw new Error(
      "Promotion image is required"
    );
  }

  const match =
    image.match(
      /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/
    );

  if (!match) {
    throw new Error(
      "Invalid promotion image format"
    );
  }

  const base64Data =
    match[2];

  const imageSize =
    Buffer.from(
      base64Data,
      "base64"
    ).length;

  if (
    imageSize >
    MAX_IMAGE_SIZE
  ) {
    throw new Error(
      "Promotion image must be less than 1 MB"
    );
  }
};


/* =========================
   LINK VALIDATION
========================= */

const validateLink = (
  link?: string
) => {
  if (!link) {
    return;
  }

  const internal =
    link.startsWith("/");

  const external =
    /^https?:\/\//i.test(link);

  if (
    !internal &&
    !external
  ) {
    throw new Error(
      "Promotion link must be an internal path or valid URL"
    );
  }
};


/* =========================
   CREATE
========================= */

export const createPromotionService =
  async (
    data: CreatePromotionInput
  ) => {
    validateImage(
      data.image
    );

    validateLink(
      data.link
    );

    return createPromotion({
      title:
        data.title?.trim() ||
        "",

      image:
        data.image,

      link:
        data.link?.trim() ||
        "/player/play",

      order:
        Number.isFinite(
          data.order
        )
          ? data.order
          : 0,

      active:
        data.active ??
        true,
    });
  };


/* =========================
   ADMIN LIST
========================= */

export const getAdminPromotionsService =
  async () => {
    return findAdminPromotions();
  };


/* =========================
   PLAYER LIST
========================= */

export const getPlayerPromotionsService =
  async () => {
    return findActivePromotions();
  };


/* =========================
   UPDATE
========================= */

export const updatePromotionService =
  async (
    id: string,
    data: UpdatePromotionInput
  ) => {
    if (data.image) {
      validateImage(
        data.image
      );
    }

    if (
      data.link !==
      undefined
    ) {
      validateLink(
        data.link
      );
    }

    const promotion =
      await updatePromotionById(
        id,
        data
      );

    if (!promotion) {
      throw new Error(
        "Promotion not found"
      );
    }

    return promotion;
  };


/* =========================
   DELETE
========================= */

export const deletePromotionService =
  async (
    id: string
  ) => {
    const promotion =
      await deletePromotionById(
        id
      );

    if (!promotion) {
      throw new Error(
        "Promotion not found"
      );
    }

    return promotion;
  };