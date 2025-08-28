import prisma from "../db/db_config.js";
import crypto from "crypto";

export const register = async (req, res) => {
  try {
    const { name, nickName, collegeName } = req.body;

    //* Better validation
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!nickName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nickname is required",
      });
    }

    if (!collegeName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "College name is required",
      });
    }

    //* Generate 12-character unique key
    const uniqueKey = crypto.randomBytes(6).toString("hex");

    //* Use transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          uniqueKey,
        },
      });

      const userData = await tx.userData.create({
        data: {
          name: name.trim(),
          nickName: nickName.trim(),
          collegeName: collegeName.trim(),
          userId: user.id,
        },
      });

      return { user, userData };
    });

    res.status(201).json({
      success: true,
      message: "User Created Successfully",
      data: result,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === "P2002" && error.meta?.target?.includes("uniqueKey")) {
      return res.status(409).json({
        success: false,
        message: "User with this unique key already exists. Please try again.",
      });
    }

    res.status(500).json({
      message: `Error: ${error.message}`,
      success: false,
    });
  }
};

export const delete_backup = async (req, res) => {
  try {
    const { name, uniqueKey } = req.body;

    if (!name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!uniqueKey.trim()) {
      return res.status(400).json({
        success: false,
        message: "Unique key is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        uniqueKey: uniqueKey,
      },
    });

    if (!user || user.name !== name.trim()) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await prisma.$transaction(async (trx) => {
      await trx.user.delete({
        where: {
          uniqueKey: uniqueKey,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "User Deleted",
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: `Error : ${e.message}`,
    });
  }
};
