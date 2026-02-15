/**
 * AttendanceGraph Component
 * ------------------------------------------------------------------
 * Displays student attendance analytics including:
 * 
 * 1. Overall attendance percentage (circular progress indicator)
 * 2. Monthly attendance summary (present, absent, total days)
 * 3. Interactive calendar view with daily attendance status
 * 4. Monthly attendance trend graph (bar chart)
 *
 * Features:
 * - Dynamic month/year navigation
 * - Optimized data filtering using useMemo
 * - Visual color coding based on attendance rules
 * - Responsive UI using Material UI
 * - Data visualization using Recharts
 *
 * Props:
 * @param {Object} student - Student object containing PRN (pgd_stu_prn)
 *
 * ------------------------------------------------------------------
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Paper,
  CircularProgress,
  Tooltip,
  Button,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  CalendarToday,
  ArrowBackIos,
  ArrowForwardIos,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import axiosInstance from "../../../../AxiosInstance";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const AttendanceGraph = ({ student }) => {
  const PRN = student?.pgd_stu_prn;
  const currentYear = new Date().getFullYear();

  const [attendanceData, setAttendanceData] = useState({
    summary: [],
    details: [],
    overall: [],
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  /* -------------------------------- FETCH DATA -------------------------------- */

  useEffect(() => {
    if (!PRN) return;

    const fetchAttendance = async () => {
      try {
        const { data } = await axiosInstance.get(
          `/attendance/getMonthwiseAttendanceDataByPRN?PRN=${PRN}`
        );

        if (data?.success) {
          setAttendanceData({
            summary: data.summary || [],
            details: data.details || [],
            overall: data.overAllAttendanceData || [],
          });
        }
      } catch {
        // Silent fail (can integrate toast later)
      }
    };

    fetchAttendance();
  }, [PRN]);

  /* -------------------------------- FILTERED DATA -------------------------------- */

  const filteredDetails = useMemo(() => {
    return attendanceData.details.filter((record) => {
      const date = new Date(record.punch_date);
      return (
        date.getMonth() === selectedMonth &&
        date.getFullYear() === selectedYear
      );
    });
  }, [attendanceData.details, selectedMonth, selectedYear]);

  const attendanceMap = useMemo(() => {
    return filteredDetails.reduce((acc, record) => {
      acc[new Date(record.punch_date).toDateString()] =
        record.stu_attendance;
      return acc;
    }, {});
  }, [filteredDetails]);

  /* -------------------------------- SUMMARY DATA -------------------------------- */

  const monthSummary = useMemo(() => {
    return (
      attendanceData.summary.find(
        (s) =>
          s.month === selectedMonth + 1 &&
          s.year === selectedYear
      ) || {}
    );
  }, [attendanceData.summary, selectedMonth, selectedYear]);

  const present = Number(monthSummary.present || 0);
  const absent = Number(monthSummary.absent || 0);
  const totalWorkingDays = Number(monthSummary.totalWorkingDays || 0);

  const attendancePercentage =
    totalWorkingDays > 0
      ? ((present / totalWorkingDays) * 100).toFixed(2)
      : 0;

  const overallData = attendanceData.overall[0] || {};
  const overallPresent = Number(overallData.present || 0);
  const overallAbsent = Number(overallData.absent || 0);
  const overallWorkingDays = Number(overallData.totalWorkingDays || 0);

  const overallPercentage =
    overallWorkingDays > 0
      ? ((overallPresent / overallWorkingDays) * 100).toFixed(2)
      : 0;

  /* -------------------------------- HELPERS -------------------------------- */

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const getPercentageColor = (percentage) => {
    if (percentage > 85) return "#388E3C";
    if (percentage >= 80) return "#FFA500";
    return "#D32F2F";
  };

  const getAttendanceColor = (attendance) => {
    const colors = {
      P: "#388E3C",
      A: "#D32F2F",
      "1/2P": "#FBC02D",
      H: "#F48FB1",
      WO: "#9E9E9E",
      WOP: "#5e02ff",
      "WO1/2P": "#BA68C8",
    };
    return colors[attendance] || "#ffffff";
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  /* -------------------------------- TREND GRAPH -------------------------------- */

  const trendData = useMemo(() => {
    return attendanceData.summary
      .filter((s) => s.year === selectedYear)
      .map((s) => ({
        month: MONTH_NAMES[s.month - 1],
        present: Number(s.present),
        absent: Number(s.absent),
      }));
  }, [attendanceData.summary, selectedYear]);

  /* -------------------------------- NAVIGATION -------------------------------- */

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => {
      if (prev === 0) {
        setSelectedYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => {
      if (prev === 11) {
        setSelectedYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  /* -------------------------------- RENDER -------------------------------- */

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
      <Grid container spacing={3}>

        {/* ---------------- OVERALL ATTENDANCE ---------------- */}

        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: "center", p: 2, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6">Overall Attendance</Typography>

              <Box position="relative" display="inline-flex" mt={2}>
                <CircularProgress
                  variant="determinate"
                  value={overallPercentage}
                  size={120}
                  thickness={5}
                  sx={{ color: getPercentageColor(overallPercentage) }}
                />
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography variant="h5" fontWeight="bold">
                    {overallPercentage}%
                  </Typography>
                </Box>
              </Box>

              <Box mt={2}>
                <Typography>Present: <b>{overallPresent}</b></Typography>
                <Typography>Absent: <b>{overallAbsent}</b></Typography>
                <Typography>Working Days: <b>{overallWorkingDays}</b></Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ---------------- MONTH NAVIGATION ---------------- */}

        <Grid item xs={12} md={8}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button startIcon={<ArrowBackIos />} onClick={handlePrevMonth}>
              Prev
            </Button>

            <Typography variant="h6">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </Typography>

            <Button endIcon={<ArrowForwardIos />} onClick={handleNextMonth}>
              Next
            </Button>
          </Box>

          <Grid container spacing={2} mt={1}>
            {[
              { label: "Total Days", value: totalWorkingDays, color: "#2196F3", icon: <CalendarToday /> },
              { label: "Present", value: present, color: "#388E3C", icon: <CheckCircle /> },
              { label: "Absent", value: absent, color: "#D32F2F", icon: <Cancel /> },
              { label: "Attendance %", value: `${attendancePercentage}%`, color: getPercentageColor(attendancePercentage), icon: <CheckCircle /> },
            ].map((item, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Card sx={{ bgcolor: item.color, color: "#fff", textAlign: "center", borderRadius: 3 }}>
                  <CardContent>
                    {item.icon}
                    <Typography variant="h6">{item.value}</Typography>
                    <Typography>{item.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* ---------------- TREND GRAPH ---------------- */}

        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attendance Trends
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={trendData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#1976d2">
                    <LabelList dataKey="present" position="top" />
                  </Bar>
                  <Bar dataKey="absent" fill="#e53935">
                    <LabelList dataKey="absent" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Paper>
  );
};

export default AttendanceGraph;
