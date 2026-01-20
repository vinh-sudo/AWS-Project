import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tasks: [
    {
      id: 1,
      taskName: "Machine Operation",
      employeeId: "EMP001",
      employeeName: "John Smith",
      line: "Line A",
      startTime: "08:00",
      endTime: "12:00",
      status: "Doing",
    },
    {
      id: 2,
      taskName: "Quality Inspection",
      employeeId: "EMP002",
      employeeName: "Jane Doe",
      line: "Line B",
      startTime: "13:00",
      endTime: "15:00",
      status: "Pending",
    },
    {
      id: 3,
      taskName: "Product Packaging",
      employeeId: "EMP003",
      employeeName: "Mike Johnson",
      line: "Line A",
      startTime: "15:30",
      endTime: "17:00",
      status: "Done",
    },
    {
      id: 4,
      taskName: "Equipment Maintenance",
      employeeId: "EMP001",
      employeeName: "John Smith",
      line: "Line A",
      startTime: "08:00",
      endTime: "10:00",
      status: "Pending",
    },
  ],
  isLoading: false,
  error: null,
};

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    // Add new task
    addTask: (state, action) => {
      const newTask = {
        id: state.tasks.length + 1,
        ...action.payload,
      };
      state.tasks.push(newTask);
    },
    // Update task status
    updateTaskStatus: (state, action) => {
      const { taskId, status } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = status;
      }
    },
    // Delete task
    deleteTask: (state, action) => {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload);
    },
    // Start task (change status to In Progress/Doing)
    startTask: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.status = "Doing";
      }
    },
    // Complete task (change status to Done)
    completeTask: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.status = "Done";
      }
    },
    // Update task
    updateTask: (state, action) => {
      const index = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...action.payload };
      }
    },
  },
});

export const {
  addTask,
  updateTaskStatus,
  deleteTask,
  startTask,
  completeTask,
  updateTask,
} = taskSlice.actions;

// Selectors
export const selectAllTasks = (state) => state.tasks.tasks;
export const selectTasksByEmployee = (employeeId) => (state) =>
  state.tasks.tasks.filter((task) => task.employeeId === employeeId);
export const selectTasksByStatus = (status) => (state) =>
  state.tasks.tasks.filter((task) => task.status === status);
export const selectTasksLoading = (state) => state.tasks.isLoading;

export default taskSlice.reducer;
