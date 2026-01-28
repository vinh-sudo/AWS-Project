import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Mock orders data
const mockOrders = [
  {
    id: "ORD-001",
    customer: "TechCorp Inc.",
    product: "PCB-A100",
    quantity: 5000,
    priority: "High",
    status: "In Progress",
    deadline: "2025-01-25",
    progress: 64,
    assignedLine: "SMT Line 1",
    createdAt: "2025-01-15",
    notes: "Rush order - priority customer",
  },
  {
    id: "ORD-002",
    customer: "ElectroParts Ltd.",
    product: "PCB-B200",
    quantity: 3000,
    priority: "Medium",
    status: "Completed",
    deadline: "2025-01-20",
    progress: 100,
    assignedLine: "Test Line 1",
    createdAt: "2025-01-10",
    notes: "",
  },
  {
    id: "ORD-003",
    customer: "MicroTech Co.",
    product: "PCB-C300",
    quantity: 8000,
    priority: "High",
    status: "In Progress",
    deadline: "2025-01-28",
    progress: 35,
    assignedLine: "SMT Line 2",
    createdAt: "2025-01-12",
    notes: "Large order - may need overtime",
  },
  {
    id: "ORD-004",
    customer: "DigiSys Corp.",
    product: "PCB-D400",
    quantity: 2500,
    priority: "Low",
    status: "Pending",
    deadline: "2025-01-30",
    progress: 0,
    assignedLine: null,
    createdAt: "2025-01-18",
    notes: "",
  },
  {
    id: "ORD-005",
    customer: "CircuitMax",
    product: "PCB-E500",
    quantity: 6000,
    priority: "Medium",
    status: "Pending",
    deadline: "2025-02-05",
    progress: 0,
    assignedLine: null,
    createdAt: "2025-01-20",
    notes: "Standard lead time",
  },
];

// Async thunks
export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockOrders;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newOrder = {
        id: `ORD-${String(mockOrders.length + 1).padStart(3, "0")}`,
        ...orderData,
        status: "Pending",
        progress: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };
      return newOrder;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateOrder = createAsyncThunk(
  "orders/updateOrder",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { id, updates };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteOrder = createAsyncThunk(
  "orders/deleteOrder",
  async (id, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  orders: [],
  selectedOrder: null,
  isLoading: false,
  error: null,
  filters: {
    status: "all",
    priority: "all",
    search: "",
  },
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { status: "all", priority: "all", search: "" };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.push(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update order
      .addCase(updateOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = {
            ...state.orders[index],
            ...action.payload.updates,
          };
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete order
      .addCase(deleteOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = state.orders.filter((o) => o.id !== action.payload);
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Actions
export const {
  setSelectedOrder,
  clearSelectedOrder,
  setFilters,
  clearFilters,
  clearError,
} = orderSlice.actions;

// Selectors
export const selectOrders = (state) => state.orders.orders;
export const selectSelectedOrder = (state) => state.orders.selectedOrder;
export const selectOrdersLoading = (state) => state.orders.isLoading;
export const selectOrdersError = (state) => state.orders.error;
export const selectOrderFilters = (state) => state.orders.filters;

// Filtered orders selector
export const selectFilteredOrders = (state) => {
  const { orders, filters } = state.orders;
  return orders.filter((order) => {
    const matchesStatus =
      filters.status === "all" || order.status === filters.status;
    const matchesPriority =
      filters.priority === "all" || order.priority === filters.priority;
    const matchesSearch =
      filters.search === "" ||
      order.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      order.customer.toLowerCase().includes(filters.search.toLowerCase()) ||
      order.product.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });
};

export default orderSlice.reducer;
