const Attendance = require("../../../models/Staffs/Attendance/attendance.model");
const Administrative = require("../../../models/Staffs/administrative/administrative.model");

// ✅ Create Attendance
exports.CreateAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;

    if (!date || !records || !Array.isArray(records)) {
      return res
        .status(400)
        .json({ message: "Date and records array are required." });
    }

    // Verify all employees exist
    for (const rec of records) {
      const exists = await Administrative.findById(rec.staffId);
      if (!exists) {
        return res
          .status(404)
          .json({ message: `Employee not found for ID: ${rec.staffId}` });
      }
    }

    // Check if attendance for the date already exists
    const existing = await Attendance.findOne({ date });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Attendance already marked for this date." });
    }

    // Create attendance
    const attendance = new Attendance({
      date,
      records,
      // createdBy,
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: "Attendance created successfully.",
      data: attendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

exports.GetAttendance = async (req, res) => {
  try {
    const { date, month } = req.body;
    console.log(date);

    // 1️⃣ Specific Date
    if (date) {
      const record = await Attendance.findOne({ date }).populate(
        "records.staffId",
        "basicDetails"
      );

      if (!record)
        return res
          .status(404)
          .json({ message: "No attendance found for this date." });

      const data = record.records.map((r) => ({
        name:
          `${r.staffId?.basicDetails?.empCode} - ${r.staffId?.basicDetails?.firstName} ${r.staffId?.basicDetails?.lastName}` ||
          "Unknown",
        status: r.status,
        inTime: r.inTime,
        outTime: r.outTime,
        comment: r.comment,
      }));

      return res.json({ type: "date", date, data });
    }

    // 2️⃣ Specific Month
    if (month) {
      const monthData = await Attendance.find({
        date: { $regex: `^${month}` }, // match all dates in month (YYYY-MM)
      }).populate("records.staffId", "basicDetails");

      if (!monthData.length) {
        return res
          .status(404)
          .json({ message: "No attendance found for this month." });
      }

      // Aggregate employee data
      const stats = {};
      monthData.forEach((day) => {
        day.records.forEach((r) => {
          const empName =
            `${r.staffId?.basicDetails?.empCode} - ${r.staffId?.basicDetails?.firstName} ${r.staffId?.basicDetails?.lastName}` ||
            "Unknown";

          if (!stats[empName]) stats[empName] = { presentDays: 0 };

          if (r.status === "PRESENT" || r.status === "HALF DAY")
            stats[empName].presentDays += 1;
        });
      });

      // Calculate total days in selected month
      const [year, monthNumber] = month.split("-"); // "2025-10"
      const totalDaysInMonth = new Date(year, monthNumber, 0).getDate();

      // Convert to final array
      const final = Object.entries(stats).map(([name, s]) => ({
        name,
        presentDays: s.presentDays,
        totalDays: totalDaysInMonth,
        presentPercentage: ((s.presentDays / totalDaysInMonth) * 100).toFixed(
          1
        ),
      }));

      return res.json({ type: "month", month, data: final });
    }

    // 3️⃣ Default: return all attendance logs (for list view)
    const all = await Attendance.find({}, "date").sort({ date: -1 });
    res.json({ type: "all", data: all });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 📊 Get Monthly Attendance Report Matrix Data
exports.GetMonthlyAttendanceReport = async (req, res) => {
  try {
    const { month } = req.body; // format "YYYY-MM"
    if (!month) {
      return res.status(400).json({ message: "Month is required (format: YYYY-MM)." });
    }

    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1; // 0-indexed month

    if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({ message: "Invalid month format. Expected YYYY-MM." });
    }

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[monthIndex] || monthStr;

    // Build days metadata
    const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, monthIndex, d);
      const dayOfWeekIndex = dateObj.getDay();
      const dayName = dayNamesShort[dayOfWeekIndex];
      days.push({
        dayNumber: d,
        dayName,
        isSunday: dayOfWeekIndex === 0
      });
    }

    // Fetch all active staff
    const staffList = await Administrative.find({ isSuspended: { $ne: true } }).select("basicDetails _id");

    // Fetch attendance records for the month
    const attendanceRecords = await Attendance.find({
      date: { $regex: `^${month}` }
    });

    // Create map: dayNumber -> { staffId -> status }
    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      const dayNum = parseInt(record.date.split("-")[2], 10);
      if (!attendanceMap[dayNum]) attendanceMap[dayNum] = {};
      record.records.forEach((r) => {
        if (r.staffId) {
          attendanceMap[dayNum][r.staffId.toString()] = r.status;
        }
      });
    });

    // Build employee rows
    const employees = staffList.map((staff, idx) => {
      const empCode = staff.basicDetails?.empCode || `EMP-${idx + 1}`;
      const firstName = staff.basicDetails?.firstName || "";
      const lastName = staff.basicDetails?.lastName || "";
      const empName = `${firstName} ${lastName}`.trim() || "Unknown Staff";
      const sId = staff._id.toString();

      const attendance = {};
      for (let d = 1; d <= daysInMonth; d++) {
        attendance[d] = attendanceMap[d]?.[sId] || "";
      }

      return {
        srNo: idx + 1,
        staffId: sId,
        empCode,
        empName,
        month: monthName,
        attendance
      };
    });

    return res.json({
      success: true,
      data: {
        year,
        month: monthName,
        monthCode: month,
        daysInMonth,
        days,
        employees
      }
    });
  } catch (error) {
    console.error("Error generating attendance report matrix:", error);
    res.status(500).json({ message: "Server error generating attendance report.", error: error.message });
  }
};

// 📥 Export Monthly Attendance Report to Excel
exports.ExportMonthlyAttendanceReport = async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) {
      return res.status(400).json({ message: "Month is required (format: YYYY-MM)." });
    }

    const ExcelJS = require("exceljs");
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

    if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({ message: "Invalid month format. Expected YYYY-MM." });
    }

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[monthIndex] || monthStr;
    const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Fetch staff and records
    const staffList = await Administrative.find({ isSuspended: { $ne: true } }).select("basicDetails _id");
    const attendanceRecords = await Attendance.find({
      date: { $regex: `^${month}` }
    });

    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      const dayNum = parseInt(record.date.split("-")[2], 10);
      if (!attendanceMap[dayNum]) attendanceMap[dayNum] = {};
      record.records.forEach((r) => {
        if (r.staffId) {
          attendanceMap[dayNum][r.staffId.toString()] = r.status;
        }
      });
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");

    const yellowFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF00" }
    };

    const borderStyle = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };

    // Row 1: Blank / spacing
    worksheet.addRow([]);

    // Row 2: Year | 2026 | Date | 1 | 2 | 3 | ... | 31
    const row2Values = ["", "Year", year, "Date"];
    const sundayColIndexes = [];

    for (let d = 1; d <= daysInMonth; d++) {
      row2Values.push(d);
    }
    const row2 = worksheet.addRow(row2Values);

    // Row 3: Month | July | Day | Wed | Thu | Fri ...
    const row3Values = ["", "Month", monthName, "Day"];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, monthIndex, d);
      const dayOfWeek = dateObj.getDay();
      const dayName = dayNamesShort[dayOfWeek];
      row3Values.push(dayName);
      if (dayOfWeek === 0) {
        sundayColIndexes.push(4 + d); // 1-based column index: Col E is 5 (for Day 1)
      }
    }
    const row3 = worksheet.addRow(row3Values);
    row3.height = 42; // Height for rotated vertical text

    // Row 4: Sr No. | Employee Code | Employee Name | Month | 1 | 2 | 3 ... 31
    const row4Values = ["Sr No.", "Employee Code", "Employee Name", "Month"];
    for (let d = 1; d <= daysInMonth; d++) {
      row4Values.push(d);
    }
    const row4 = worksheet.addRow(row4Values);

    const maxCol = 4 + daysInMonth;

    // Style Header Rows (Row 2, 3, 4)
    for (let c = 1; c <= maxCol; c++) {
      // Row 2
      const c2 = row2.getCell(c);
      c2.font = { bold: true };
      c2.border = borderStyle;
      c2.alignment = { horizontal: "center", vertical: "middle" };

      // Row 3
      const c3 = row3.getCell(c);
      c3.font = { bold: true };
      c3.border = borderStyle;
      if (c >= 5) {
        c3.alignment = { textRotation: 90, horizontal: "center", vertical: "middle" };
      } else {
        c3.alignment = { horizontal: "center", vertical: "middle" };
      }
      if (sundayColIndexes.includes(c)) {
        c3.fill = yellowFill;
      }

      // Row 4
      const c4 = row4.getCell(c);
      c4.font = { bold: true };
      c4.border = borderStyle;
      c4.alignment = { horizontal: "center", vertical: "middle" };
      if (sundayColIndexes.includes(c)) {
        c4.fill = yellowFill;
      }
    }

    // Data Rows (Row 5+)
    staffList.forEach((staff, idx) => {
      const empCode = staff.basicDetails?.empCode || `EMP-${idx + 1}`;
      const firstName = staff.basicDetails?.firstName || "";
      const lastName = staff.basicDetails?.lastName || "";
      const empName = `${firstName} ${lastName}`.trim() || "Unknown Staff";
      const sId = staff._id.toString();

      const rowValues = [idx + 1, empCode, empName, monthName];
      for (let d = 1; d <= daysInMonth; d++) {
        const fullStatus = attendanceMap[d]?.[sId] || "";
        let shortStatus = "";
        if (fullStatus === "PRESENT") shortStatus = "P";
        else if (fullStatus === "ABSENT") shortStatus = "A";
        else if (fullStatus === "HALF DAY") shortStatus = "HD";
        rowValues.push(shortStatus);
      }

      const dataRow = worksheet.addRow(rowValues);
      for (let c = 1; c <= maxCol; c++) {
        const cell = dataRow.getCell(c);
        cell.border = borderStyle;
        cell.alignment = c === 3 ? { horizontal: "left", vertical: "middle" } : { horizontal: "center", vertical: "middle" };
        if (sundayColIndexes.includes(c)) {
          cell.fill = yellowFill;
        }
      }
    });

    // Set Column Widths
    worksheet.getColumn(1).width = 8;  // Sr No
    worksheet.getColumn(2).width = 16; // Employee Code
    worksheet.getColumn(3).width = 22; // Employee Name
    worksheet.getColumn(4).width = 10; // Month
    for (let d = 1; d <= daysInMonth; d++) {
      worksheet.getColumn(4 + d).width = 3.6; // Narrow date columns
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Attendance_Report_${monthName}_${year}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting attendance report:", error);
    res.status(500).json({ message: "Server error exporting report.", error: error.message });
  }
};

// 📄 Export Monthly Attendance Report to CSV
exports.ExportMonthlyAttendanceReportCSV = async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) {
      return res.status(400).json({ message: "Month is required (format: YYYY-MM)." });
    }

    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

    if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({ message: "Invalid month format. Expected YYYY-MM." });
    }

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[monthIndex] || monthStr;
    const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const staffList = await Administrative.find({ isSuspended: { $ne: true } }).select("basicDetails _id");
    const attendanceRecords = await Attendance.find({
      date: { $regex: `^${month}` }
    });

    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      const dayNum = parseInt(record.date.split("-")[2], 10);
      if (!attendanceMap[dayNum]) attendanceMap[dayNum] = {};
      record.records.forEach((r) => {
        if (r.staffId) {
          attendanceMap[dayNum][r.staffId.toString()] = r.status;
        }
      });
    });

    const escapeCsv = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const rows = [];

    // Row 1: Blank spacing
    rows.push([]);

    // Row 2: Year | 2026 | Date | 1 | 2 | 3 ... 31
    const row2 = ["", "Year", year, "Date"];
    for (let d = 1; d <= daysInMonth; d++) row2.push(d);
    rows.push(row2.map(escapeCsv).join(","));

    // Row 3: Month | July | Day | Wed | Thu | Fri ...
    const row3 = ["", "Month", monthName, "Day"];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, monthIndex, d);
      row3.push(dayNamesShort[dateObj.getDay()]);
    }
    rows.push(row3.map(escapeCsv).join(","));

    // Row 4: Sr No. | Employee Code | Employee Name | Month | 1 | 2 ... 31
    const row4 = ["Sr No.", "Employee Code", "Employee Name", "Month"];
    for (let d = 1; d <= daysInMonth; d++) row4.push(d);
    rows.push(row4.map(escapeCsv).join(","));

    // Data Rows (Row 5+)
    staffList.forEach((staff, idx) => {
      const empCode = staff.basicDetails?.empCode || `EMP-${idx + 1}`;
      const firstName = staff.basicDetails?.firstName || "";
      const lastName = staff.basicDetails?.lastName || "";
      const empName = `${firstName} ${lastName}`.trim() || "Unknown Staff";
      const sId = staff._id.toString();

      const rowValues = [idx + 1, empCode, empName, monthName];
      for (let d = 1; d <= daysInMonth; d++) {
        const fullStatus = attendanceMap[d]?.[sId] || "";
        let shortStatus = "";
        if (fullStatus === "PRESENT") shortStatus = "P";
        else if (fullStatus === "ABSENT") shortStatus = "A";
        else if (fullStatus === "HALF DAY") shortStatus = "HD";
        rowValues.push(shortStatus);
      }
      rows.push(rowValues.map(escapeCsv).join(","));
    });

    const csvOutput = "\uFEFF" + rows.join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Attendance_Report_${monthName}_${year}.csv`
    );

    res.status(200).send(csvOutput);
  } catch (error) {
    console.error("Error exporting attendance CSV report:", error);
    res.status(500).json({ message: "Server error exporting CSV report.", error: error.message });
  }
};

