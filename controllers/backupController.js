import prisma from "../db/db_config.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

//* Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

//* ADD BACKUP
export const add_backup = async (req, res) => {
  try {
    const { name, uniqueKey, subjects, attendanceRecords } = req.body;

    //* Enhanced validation
    if (!name?.trim() || !uniqueKey?.trim()) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Name and unique key are required!",
      });
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Subjects list cannot be empty!",
      });
    }

    //* Validate each subject has required fields
    const invalidSubjects = subjects.filter(
      (s) =>
        !s.name?.trim() ||
        typeof s.totalLectures !== "number" ||
        s.totalLectures < 0
    );

    if (invalidSubjects.length > 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "All subjects must have valid name and totalLectures",
      });
    }

    //* Find user first
    const user = await prisma.user.findUnique({
      where: {
        uniqueKey: uniqueKey.trim(),
      },
    });

    if (!user || user.name !== name.trim()) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        statusCode: 404,
      });
    }

    //* Find userData using user.id
    const userData = await prisma.userData.findFirst({
      where: { userId: user.id },
    });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User data not found",
        statusCode: 404,
      });
    }

    //* Replace old data in transaction
    const result = await prisma.$transaction(async (tx) => {
      //* Delete existing attendance records and subjects
      await tx.attendanceRecord.deleteMany({
        where: { userId: user.id },
      });

      await tx.subject.deleteMany({
        where: { userDataId: userData.id },
      });

      //* Create subjects first and collect their IDs
      const createdSubjectsData = [];
      const subjectNameToIdMap = new Map();

      for (const s of subjects) {
        const createdSubject = await tx.subject.create({
          data: {
            name: s.name.trim(),
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            description: s.description?.trim() || null,
            attendedLectures: parseInt(s.attendedLectures),
            totalLectures: parseInt(s.totalLectures),
            targetPercentage: s.targetPercentage
              ? parseInt(s.targetPercentage)
              : 75,
            userDataId: userData.id,
            userId: user.id,
          },
        });

        createdSubjectsData.push(createdSubject);
        subjectNameToIdMap.set(s.name.trim(), createdSubject.id);
      }

      //* Handle attendance records if provided
      let attendanceCount = 0;
      if (Array.isArray(attendanceRecords) && attendanceRecords.length > 0) {
        const attendanceToCreate = attendanceRecords
          .filter(
            (record) =>
              record.subjectName?.trim() &&
              record.date &&
              subjectNameToIdMap.has(record.subjectName.trim())
          )
          .map((record) => ({
            date: new Date(record.date),
            subjectName: record.subjectName,
            markedAt: record.markedAt ? new Date(record.markedAt) : new Date(),
            notes: record.notes?.trim() || null,
            isPresent: record.isPresent,
            lectureNumber: record.lectureNumber,
            subjectId: subjectNameToIdMap.get(record.subjectName.trim()),
            userId: user.id,
          }));

        if (attendanceToCreate.length > 0) {
          const createdAttendance = await tx.attendanceRecord.createMany({
            data: attendanceToCreate,
          });
          attendanceCount = createdAttendance.count;
        }
      }

      return {
        subjects: createdSubjectsData,
        attendanceCount,
      };
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `${result.subjects.length} subjects and ${result.attendanceCount} attendance records replaced successfully`,
      data: {
        subjectsCount: result.subjects.length,
        attendanceCount: result.attendanceCount,
      },
    });
  } catch (error) {
    console.error("Backup error:", error);
    res.status(500).json({
      statusCode: 500,
      message: `Error: ${error.message}`,
      success: false,
    });
  }
};

//* GET BACKUP
export const get_backup = async (req, res) => {
  try {
    const { name, uniqueKey } = req.params;

    //* Enhanced validation
    if (!name?.trim() || !uniqueKey?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and unique key are required",
        statusCode: 400,
      });
    }

    //* Find user with better error handling
    const user = await prisma.user.findUnique({
      where: {
        uniqueKey: uniqueKey.trim(),
      },
    });

    if (!user || user.name !== name.trim()) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        statusCode: 404,
      });
    }

    //* Get user data with subjects included
    const userAttendanceData = await prisma.userData.findFirst({
      where: {
        userId: user.id,
      },
      include: {
        subjects: {
          include: {
            attendanceHistory: {
              orderBy: { date: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!userAttendanceData) {
      return res.status(404).json({
        success: false,
        message: "User data not found",
        statusCode: 404,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      data: {
        userAttendanceData,
        totalSubjects: userAttendanceData.subjects.length,
      },
    });
  } catch (error) {
    console.error("Get backup error:", error);
    res.status(500).json({
      statusCode: 500,
      message: `Error: ${error.message}`,
      success: false,
    });
  }
};

//* SEND EMAIL
export const send_email = async (req, res) => {
  try {
    const { email, name, key } = req.body;

    if (!email || !key || !name) {
      return res.status(400).json({
        error: "Missing required fields: name or email or key",
        statusCode: 400,
      });
    }

    const subject = "Your unique key for attendance record";
    const html = `
      <p>Hi ${name || "there"},</p>

      <p>This is your unique key for your attendance record.</p>
      <p>If you lost your data or cleared your app’s data, use this key to recover your data.</p>
      <p><b>${key}</b></p>

      <p>Best regards,<br/>Class Track Team</p>
    `;

    const text = `Hi ${
      name || "there"
    },\n\nYour unique key for your attendance record is: ${key}\n\nIf you lost your data or cleared your app’s data, use this key to recover your data.\n\nBest regards,\nClass Track Team`;

    const info = await transporter.sendMail({
      from: `Class Track`,
      to: email,
      subject,
      text,
      html,
    });

    console.log("Email sent:", info.messageId);
    res.json({ message: "Email sent successfully", statusCode: 200 });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ error: "Failed to send email", statusCode: 500 });
  }
};

//* GET BACKUP TIMETABLE
export const get_backup_timetable = async (req, res) => {
  try {
    const { name, uniqueKey } = req.body;

    //* Enhanced validation
    if (!name?.trim() || !uniqueKey?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and unique key are required",
        statusCode: 400,
      });
    }

    //* Find user
    const user = await prisma.user.findUnique({
      where: {
        uniqueKey: uniqueKey.trim(),
      },
    });

    if (!user || user.name !== name.trim()) {
      return res.status(404).json({
        success: false,
        message: "No User Found !!",
        statusCode: 404,
      });
    }

    //* Get timetable
    const timetable = await prisma.timeTable.findFirst({
      where: {
        name: name.trim(),
        userId: user.id,
      },
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "No timetable found",
        statusCode: 404,
      });
    }

    return res.status(200).json({
      success: true,
      data: timetable,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Get timetable error:", error);
    res.status(500).json({
      message: `Error: ${error.message}`,
      statusCode: 500,
      success: false,
    });
  }
};
