import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";

// NOTE: lineSlice, orderSlice, scheduleSlice, taskSlice, userSlice contain
// only mock data and are not used by any component. They are excluded from
// the store to reduce bundle size. Pages use service files for API calls.

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
