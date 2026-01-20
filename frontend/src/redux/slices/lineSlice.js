import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Mock production lines data
const mockLines = [
  {
    id: "LINE-SMT-01",
    name: "SMT Line 1",
    type: "SMT",
    location: "Building A - Floor 1",
    capacity: 500,
    capacityUnit: "boards/hour",
    status: "Running",
    oee: 85,
    shift: "Day Shift (08:00-17:00)",
    supervisor: "John Smith",
    machines: [
      {
        id: "M001",
        name: "Pick & Place A1",
        type: "Pick & Place",
        status: "Running",
        efficiency: 92,
      },
      {
        id: "M002",
        name: "Reflow Oven R1",
        type: "Reflow Oven",
        status: "Running",
        efficiency: 88,
      },
      {
        id: "M003",
        name: "AOI Inspector",
        type: "AOI",
        status: "Running",
        efficiency: 95,
      },
      {
        id: "M004",
        name: "Solder Paste Printer",
        type: "Printer",
        status: "Running",
        efficiency: 90,
      },
    ],
    currentOrder: "ORD-001",
    completedToday: 4200,
    targetToday: 5000,
  },
  {
    id: "LINE-SMT-02",
    name: "SMT Line 2",
    type: "SMT",
    location: "Building A - Floor 1",
    capacity: 450,
    capacityUnit: "boards/hour",
    status: "Running",
    oee: 72,
    shift: "Day Shift (08:00-17:00)",
    supervisor: "Jane Doe",
    machines: [
      {
        id: "M005",
        name: "Pick & Place A2",
        type: "Pick & Place",
        status: "Running",
        efficiency: 85,
      },
      {
        id: "M006",
        name: "Reflow Oven R2",
        type: "Reflow Oven",
        status: "Warning",
        efficiency: 70,
      },
      {
        id: "M007",
        name: "AOI Inspector 2",
        type: "AOI",
        status: "Running",
        efficiency: 90,
      },
    ],
    currentOrder: "ORD-003",
    completedToday: 2800,
    targetToday: 4000,
  },
  {
    id: "LINE-ASM-01",
    name: "Assembly Line 1",
    type: "Assembly",
    location: "Building B - Floor 1",
    capacity: 200,
    capacityUnit: "units/hour",
    status: "Idle",
    oee: 0,
    shift: "Day Shift (08:00-17:00)",
    supervisor: "Mike Johnson",
    machines: [
      {
        id: "M008",
        name: "Assembly Station 1",
        type: "Assembly",
        status: "Idle",
        efficiency: 0,
      },
      {
        id: "M009",
        name: "Assembly Station 2",
        type: "Assembly",
        status: "Idle",
        efficiency: 0,
      },
      {
        id: "M010",
        name: "Soldering Station",
        type: "Soldering",
        status: "Idle",
        efficiency: 0,
      },
    ],
    currentOrder: null,
    completedToday: 0,
    targetToday: 0,
  },
  {
    id: "LINE-TST-01",
    name: "Test Line 1",
    type: "Test",
    location: "Building B - Floor 2",
    capacity: 300,
    capacityUnit: "units/hour",
    status: "Running",
    oee: 60,
    shift: "Day Shift (08:00-17:00)",
    supervisor: "Sarah Williams",
    machines: [
      {
        id: "M011",
        name: "ICT Tester",
        type: "ICT",
        status: "Running",
        efficiency: 65,
      },
      {
        id: "M012",
        name: "FCT Tester",
        type: "FCT",
        status: "Running",
        efficiency: 70,
      },
      {
        id: "M013",
        name: "Burn-in Chamber",
        type: "Burn-in",
        status: "Maintenance",
        efficiency: 0,
      },
    ],
    currentOrder: "ORD-002",
    completedToday: 1500,
    targetToday: 2500,
  },
];

// Async thunks
export const fetchLines = createAsyncThunk(
  "lines/fetchLines",
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockLines;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createLine = createAsyncThunk(
  "lines/createLine",
  async (lineData, { rejectWithValue }) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newLine = {
        id: `LINE-${lineData.type.toUpperCase()}-${String(mockLines.length + 1).padStart(2, "0")}`,
        ...lineData,
        machines: [],
        currentOrder: null,
        completedToday: 0,
        targetToday: 0,
        oee: 0,
        status: "Idle",
      };
      return newLine;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateLine = createAsyncThunk(
  "lines/updateLine",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { id, updates };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateLineStatus = createAsyncThunk(
  "lines/updateLineStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { id, status };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteLine = createAsyncThunk(
  "lines/deleteLine",
  async (id, { rejectWithValue }) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Add machine to line
export const addMachine = createAsyncThunk(
  "lines/addMachine",
  async ({ lineId, machineData }, { rejectWithValue }) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        lineId,
        machine: {
          id: `M${Date.now()}`,
          ...machineData,
          status: "Idle",
          efficiency: 0,
        },
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  lines: [],
  selectedLine: null,
  isLoading: false,
  error: null,
  filters: {
    type: "all",
    status: "all",
  },
};

const lineSlice = createSlice({
  name: "lines",
  initialState,
  reducers: {
    setSelectedLine: (state, action) => {
      state.selectedLine = action.payload;
    },
    clearSelectedLine: (state) => {
      state.selectedLine = null;
    },
    setLineFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearLineFilters: (state) => {
      state.filters = { type: "all", status: "all" };
    },
    clearLineError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch lines
      .addCase(fetchLines.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLines.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lines = action.payload;
      })
      .addCase(fetchLines.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create line
      .addCase(createLine.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createLine.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lines.push(action.payload);
      })
      .addCase(createLine.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update line
      .addCase(updateLine.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateLine.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.lines.findIndex((l) => l.id === action.payload.id);
        if (index !== -1) {
          state.lines[index] = {
            ...state.lines[index],
            ...action.payload.updates,
          };
        }
      })
      .addCase(updateLine.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update line status
      .addCase(updateLineStatus.fulfilled, (state, action) => {
        const index = state.lines.findIndex((l) => l.id === action.payload.id);
        if (index !== -1) {
          state.lines[index].status = action.payload.status;
        }
      })
      // Delete line
      .addCase(deleteLine.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteLine.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lines = state.lines.filter((l) => l.id !== action.payload);
      })
      .addCase(deleteLine.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add machine
      .addCase(addMachine.fulfilled, (state, action) => {
        const index = state.lines.findIndex(
          (l) => l.id === action.payload.lineId
        );
        if (index !== -1) {
          state.lines[index].machines.push(action.payload.machine);
        }
      });
  },
});

// Actions
export const {
  setSelectedLine,
  clearSelectedLine,
  setLineFilters,
  clearLineFilters,
  clearLineError,
} = lineSlice.actions;

// Selectors
export const selectLines = (state) => state.lines.lines;
export const selectSelectedLine = (state) => state.lines.selectedLine;
export const selectLinesLoading = (state) => state.lines.isLoading;
export const selectLinesError = (state) => state.lines.error;
export const selectLineFilters = (state) => state.lines.filters;

// Filtered lines selector
export const selectFilteredLines = (state) => {
  const { lines, filters } = state.lines;
  return lines.filter((line) => {
    const matchesType = filters.type === "all" || line.type === filters.type;
    const matchesStatus =
      filters.status === "all" || line.status === filters.status;
    return matchesType && matchesStatus;
  });
};

// Summary selectors
export const selectLinesSummary = (state) => {
  const lines = state.lines.lines;
  return {
    total: lines.length,
    running: lines.filter((l) => l.status === "Running").length,
    idle: lines.filter((l) => l.status === "Idle").length,
    maintenance: lines.filter((l) => l.status === "Maintenance").length,
    totalCapacity: lines.reduce((sum, l) => sum + l.capacity, 0),
    averageOEE:
      lines.filter((l) => l.oee > 0).length > 0
        ? Math.round(
            lines.filter((l) => l.oee > 0).reduce((sum, l) => sum + l.oee, 0) /
              lines.filter((l) => l.oee > 0).length
          )
        : 0,
  };
};

export default lineSlice.reducer;
