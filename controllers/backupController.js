import prisma from "../config/prisma.js";

export const add_backup = async (req, res) => {
  try {
    const {
      name,
      nickName,
      collegeName,
      uniqueKey,
      subjects,
      attendanceRecords,
    } = req.body;

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

    if (!Array.isArray(subjects) || subjects.length == 0) {
      return res.status(400).json({
        success: false,
        message: "Subjects list cannot be empty",
      });
    }

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length == 0) {
      return res.status(400).json({
        success: false,
        message: "Attendance list cannot be empty",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        uniqueKey: uniqueKey,
      },
    });

    let userData;

    if (!user) {
      userData = await prisma.user.create({
        data: {
          name: name,
          uniqueKey: uniqueKey,
          nickName: nickName,
          collegeName: collegeName,
        },
      });
    } else {
      userData = user;
    }

    const invalidSubjects = subjects.filter(
      (s) =>
        !s.name?.trim() ||
        typeof s.totalLectures !== "number" ||
        s.totalLectures < 0
    );

    if (invalidSubjects.length > 0) {
      return res.status(400).json({
        success: false,
        message: "All subjects must have valid name and totalLectures",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.attendanceRecord.deleteMany({
        where: { userId: userData.id },
      });

      await tx.subject.deleteMany({
        where: { userId: userData.id },
      });

      const createdSubjectsData = [];
      const subjectNameToIdMap = new Map();

      for (const s of subjects) {
        const createdSubject = await tx.subject.create({
          data: {
            name: s.name.trim(),
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            description: s.description?.trim() || null,
            totalLectures: parseInt(s.totalLectures),
            targetPercentage: s.targetPercentage
              ? parseInt(s.targetPercentage)
              : 75,
            userId: userData.id,
          },
        });

        createdSubjectsData.push(createdSubject);
        subjectNameToIdMap.set(s.name.trim(), createdSubject.id);
      }

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
            markedAt: record.markedAt ? new Date(record.markedAt) : new Date(),
            notes: record.notes?.trim() || null,
            subjectId: subjectNameToIdMap.get(record.subjectName.trim()),
            userId: userData.id,
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
      message: `${result.subjects.length} subjects and ${result.attendanceCount} attendance records replaced successfully`,
      data: {
        subjectsCount: result.subjects.length,
        attendanceCount: result.attendanceCount,
      },
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: `Error : ${e.message}`,
    });
  }
};

export const get_backup = async (req, res) => {
  try {
    const { name, uniqueKey } = req.params;

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
      include: {
        Subject: {
          include: {
            attendanceHistory: {
              orderBy: { date: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user || user.name !== name.trim()) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Backup Details Fetched Successfully",
      data: {
        user,
        totalSubjects: user.Subject.length,
      },
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: `Error : ${e.message}`,
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
