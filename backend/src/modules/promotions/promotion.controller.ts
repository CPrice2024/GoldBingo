import {
  Request,
  Response,
} from "express";

import {
  createPromotionService,
  deletePromotionService,
  getAdminPromotionsService,
  getPlayerPromotionsService,
  updatePromotionService,
} from "./promotion.service";


/* =========================
   PLAYER
========================= */

export const getPlayerSidebarPromotionsController =
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const promotions =
        await getPlayerPromotionsService();

      return res.status(200).json({
        success: true,
        data: promotions,
      });
    } catch (error) {
      console.error(
        "Get player promotions error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load promotions",
      });
    }
  };


/* =========================
   ADMIN LIST
========================= */

export const getAdminPromotionsController =
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const promotions =
        await getAdminPromotionsService();

      return res.status(200).json({
        success: true,
        data: promotions,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          "Failed to load promotions",
      });
    }
  };


/* =========================
   ADMIN CREATE
========================= */

export const createPromotionController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        title,
        image,
        link,
        order,
        active,
      } = req.body;

      if (
        typeof image !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Promotion image is required",
          });
      }

      const promotion =
        await createPromotionService(
          {
            title,
            image,
            link,
            order:
              typeof order ===
              "number"
                ? order
                : undefined,

            active:
              typeof active ===
              "boolean"
                ? active
                : undefined,
          }
        );

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Promotion created successfully",
          data: promotion,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Failed to create promotion",
        });
    }
  };


/* =========================
   ADMIN UPDATE
========================= */

export const updatePromotionController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        req.params.id;

      if (
        typeof id !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid promotion ID",
          });
      }

      const promotion =
        await updatePromotionService(
          id,
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Promotion updated successfully",
        data: promotion,
      });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Failed to update promotion",
        });
    }
  };


/* =========================
   ADMIN DELETE
========================= */

export const deletePromotionController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        req.params.id;

      if (
        typeof id !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid promotion ID",
          });
      }

      await deletePromotionService(
        id
      );

      return res.status(200).json({
        success: true,
        message:
          "Promotion deleted successfully",
      });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Failed to delete promotion",
        });
    }
  };