import mongoose from "mongoose";

import {
  Info,
} from "./info.model";

import {
  CreateInfoInput,
  UpdateInfoInput,
} from "./info.types";


/* =========================
   CREATE INFO
========================= */

export const createInfo = async (
  adminId: string,
  data: CreateInfoInput
) => {

  if (
    !mongoose.Types.ObjectId
      .isValid(adminId)
  ) {
    throw new Error(
      "Invalid admin ID"
    );
  }


  const title =
    String(data.title || "")
      .trim();

  const content =
    String(data.content || "")
      .trim();


  if (!title) {
    throw new Error(
      "Info title is required"
    );
  }


  if (!content) {
    throw new Error(
      "Info content is required"
    );
  }


  const isPublished =
    data.isPublished === true;


  const info =
    await Info.create({
      title,

      content,

      category:
        data.category ||
        "general",

      isPublished,

      createdBy:
        new mongoose.Types.ObjectId(
          adminId
        ),

      publishedAt:
        isPublished
          ? new Date()
          : undefined,
    });


  return info;
};


/* =========================
   PLAYER - PUBLISHED INFO
========================= */

export const getPublishedInfo =
  async () => {

    return Info.find({
      isPublished: true,
    })
      .sort({
        publishedAt: -1,
        createdAt: -1,
      })
      .lean();
  };


/* =========================
   PLAYER - SINGLE INFO
========================= */

export const getPublishedInfoById =
  async (
    infoId: string
  ) => {

    if (
      !mongoose.Types.ObjectId
        .isValid(infoId)
    ) {
      throw new Error(
        "Invalid info ID"
      );
    }


    const info =
      await Info.findOne({
        _id: infoId,
        isPublished: true,
      }).lean();


    if (!info) {
      throw new Error(
        "Information not found"
      );
    }


    return info;
  };


/* =========================
   ADMIN - ALL INFO
========================= */

export const getAdminInfo =
  async () => {

    return Info.find()
      .populate(
        "createdBy",
        "fullName phone role"
      )
      .sort({
        createdAt: -1,
      })
      .lean();
  };


/* =========================
   UPDATE INFO
========================= */

export const updateInfo = async (
  infoId: string,
  data: UpdateInfoInput
) => {

  if (
    !mongoose.Types.ObjectId
      .isValid(infoId)
  ) {
    throw new Error(
      "Invalid info ID"
    );
  }


  const info =
    await Info.findById(
      infoId
    );


  if (!info) {
    throw new Error(
      "Information not found"
    );
  }


  if (
    data.title !== undefined
  ) {

    const title =
      String(data.title)
        .trim();

    if (!title) {
      throw new Error(
        "Info title cannot be empty"
      );
    }

    info.title =
      title;
  }


  if (
    data.content !== undefined
  ) {

    const content =
      String(data.content)
        .trim();

    if (!content) {
      throw new Error(
        "Info content cannot be empty"
      );
    }

    info.content =
      content;
  }


  if (
    data.category !== undefined
  ) {
    info.category =
      data.category;
  }


  await info.save();

  return info;
};


/* =========================
   PUBLISH / UNPUBLISH
========================= */

export const setInfoPublishStatus =
  async (
    infoId: string,
    isPublished: boolean
  ) => {

    if (
      !mongoose.Types.ObjectId
        .isValid(infoId)
    ) {
      throw new Error(
        "Invalid info ID"
      );
    }


    const info =
      await Info.findById(
        infoId
      );


    if (!info) {
      throw new Error(
        "Information not found"
      );
    }


    info.isPublished =
      isPublished;


    if (isPublished) {

      info.publishedAt =
        new Date();

    } else {

      info.publishedAt =
        undefined;

    }


    await info.save();

    return info;
  };


/* =========================
   DELETE INFO
========================= */

export const deleteInfo =
  async (
    infoId: string
  ) => {

    if (
      !mongoose.Types.ObjectId
        .isValid(infoId)
    ) {
      throw new Error(
        "Invalid info ID"
      );
    }


    const info =
      await Info.findByIdAndDelete(
        infoId
      );


    if (!info) {
      throw new Error(
        "Information not found"
      );
    }


    return info;
  };