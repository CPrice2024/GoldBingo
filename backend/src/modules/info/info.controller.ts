import {
  Request,
  Response,
} from "express";

import {
  createInfo,
  deleteInfo,
  getAdminInfo,
  getPublishedInfo,
  getPublishedInfoById,
  setInfoPublishStatus,
  updateInfo,
} from "./info.service";


/* =========================
   GET AUTH USER ID
========================= */

const getUserId = (
  req: Request
) => {

  const user =
    (req as any).user;

  return (
    user?._id?.toString?.() ||
    user?.id?.toString?.() ||
    user?.userId?.toString?.() ||
    ""
  );
};
/* =========================
   GET ROUTE PARAM
========================= */

const getParamId = (
  value: string | string[] | undefined
): string => {

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
};

/* =========================
   PLAYER - GET PUBLISHED
========================= */

export const getPlayerInfoController =
  async (
    _req: Request,
    res: Response
  ) => {

    try {

      const info =
        await getPublishedInfo();

      return res.status(200).json({
        success: true,
        data: info,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load information",
      });
    }
  };


/* =========================
   PLAYER - GET ONE
========================= */

export const getPlayerInfoByIdController =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const info =
        await getPublishedInfoById(
          getParamId(req.params.id)
        );

      return res.status(200).json({
        success: true,
        data: info,
      });

    } catch (error) {

      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Information not found",
      });
    }
  };


/* =========================
   ADMIN - GET ALL
========================= */

export const getAdminInfoController =
  async (
    _req: Request,
    res: Response
  ) => {

    try {

      const info =
        await getAdminInfo();

      return res.status(200).json({
        success: true,
        data: info,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load information",
      });
    }
  };


/* =========================
   ADMIN - CREATE
========================= */

export const createInfoController =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const adminId =
        getUserId(req);


      if (!adminId) {

        return res.status(401).json({
          success: false,
          message:
            "Authenticated admin not found",
        });
      }


      const info =
        await createInfo(
          adminId,
          req.body
        );


      return res.status(201).json({
        success: true,
        message:
          "Information created successfully",
        data: info,
      });

    } catch (error) {

      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create information",
      });
    }
  };


/* =========================
   ADMIN - UPDATE
========================= */

export const updateInfoController =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const info =
        await updateInfo(
          getParamId(req.params.id),
          req.body
        );


      return res.status(200).json({
        success: true,
        message:
          "Information updated successfully",
        data: info,
      });

    } catch (error) {

      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update information",
      });
    }
  };


/* =========================
   ADMIN - PUBLISH
========================= */

export const publishInfoController =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      if (
        typeof req.body
          ?.isPublished !==
        "boolean"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "isPublished must be true or false",
        });
      }


      const info =
        await setInfoPublishStatus(
          getParamId(req.params.id),
          req.body.isPublished
        );


      return res.status(200).json({
        success: true,
        message:
          req.body.isPublished
            ? "Information published successfully"
            : "Information unpublished successfully",
        data: info,
      });

    } catch (error) {

      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update publish status",
      });
    }
  };


/* =========================
   ADMIN - DELETE
========================= */

export const deleteInfoController =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      await deleteInfo(
        getParamId(req.params.id)
      );


      return res.status(200).json({
        success: true,
        message:
          "Information deleted successfully",
      });

    } catch (error) {

      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete information",
      });
    }
  };