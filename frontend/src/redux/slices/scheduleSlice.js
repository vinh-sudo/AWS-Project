import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  schedules: [
    {
      id: "SCH-001",
      name: "SCH-001 - Line A - 08:00-12:00",
      line: "Line A",
      startTime: "08:00",
      endTime: "12:00",
      orderId: "ORD-001",
    },
    {
      id: "SCH-002",
      name: "SCH-002 - Line B - 13:00-17:00",
      line: "Line B",
      startTime: "13:00",
      endTime: "17:00",
      orderId: "ORD-002",
    },
    {
      id: "SCH-003",
      name: "SCH-003 - Line C - 08:00-12:00",
      line: "Line C",
      startTime: "08:00",
      endTime: "12:00",
      orderId: "ORD-003",
    },
    {
      id: "SCH-004",
      name: "SCH-004 - Line A - 13:00-17:00",
      line: "Line A",
      startTime: "13:00",
      endTime: "17:00",
      orderId: "ORD-001",
    },
    {
      id: "SCH-005",
      name: "SCH-005 - Line D - 08:00-17:00",
      line: "Line D",
      startTime: "08:00",
      endTime: "17:00",
      orderId: "ORD-004",
    },
  ],
  productionLines: [
    { id: "line-a", name: "Line A" },
    { id: "line-b", name: "Line B" },
    { id: "line-c", name: "Line C" },
    { id: "line-d", name: "Line D" },
    { id: "line-e", name: "Line E" },
  ],
  orders: [
    { id: "ORD-001", name: "ORD-001 - ABC Corp", status: "In Progress" },
    { id: "ORD-002", name: "ORD-002 - XYZ Ltd", status: "Pending" },
    { id: "ORD-003", name: "ORD-003 - DEF Inc", status: "Pending" },
    { id: "ORD-004", name: "ORD-004 - GHI Company", status: "Completed" },
    { id: "ORD-005", name: "ORD-005 - JKL Corp", status: "In Progress" },
  ],
  isLoading: false,
  error: null,
};

const scheduleSlice = createSlice({
  name: "schedules",
  initialState,
  reducers: {
    // Add new schedule
    addSchedule: (state, action) => {
      const newSchedule = {
        id: `SCH-${String(state.schedules.length + 1).padStart(3, "0")}`,
        ...action.payload,
      };
      newSchedule.name = `${newSchedule.id} - ${newSchedule.line} - ${newSchedule.startTime}-${newSchedule.endTime}`;
      state.schedules.push(newSchedule);
    },
    // Update schedule
    updateSchedule: (state, action) => {
      const index = state.schedules.findIndex(
        (s) => s.id === action.payload.id
      );
      if (index !== -1) {
        state.schedules[index] = {
          ...state.schedules[index],
          ...action.payload,
        };
      }
    },
    // Delete schedule
    deleteSchedule: (state, action) => {
      state.schedules = state.schedules.filter(
        (schedule) => schedule.id !== action.payload
      );
    },
    // Add order
    addOrder: (state, action) => {
      const newOrder = {
        id: `ORD-${String(state.orders.length + 1).padStart(3, "0")}`,
        ...action.payload,
        status: "Pending",
      };
      state.orders.push(newOrder);
    },
    // Update order status
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const order = state.orders.find((o) => o.id === orderId);
      if (order) {
        order.status = status;
      }
    },
    // Delete order
    deleteOrder: (state, action) => {
      state.orders = state.orders.filter(
        (order) => order.id !== action.payload
      );
    },
  },
});

export const {
  addSchedule,
  updateSchedule,
  deleteSchedule,
  addOrder,
  updateOrderStatus,
  deleteOrder,
} = scheduleSlice.actions;

// Selectors
export const selectAllSchedules = (state) => state.schedules.schedules;
export const selectAllProductionLines = (state) =>
  state.schedules.productionLines;
export const selectAllOrders = (state) => state.schedules.orders;
export const selectSchedulesByLine = (line) => (state) =>
  state.schedules.schedules.filter((schedule) => schedule.line === line);
export const selectOrdersByStatus = (status) => (state) =>
  state.schedules.orders.filter((order) => order.status === status);
export const selectSchedulesLoading = (state) => state.schedules.isLoading;

export default scheduleSlice.reducer;
