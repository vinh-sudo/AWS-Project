import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import taskReducer from "./slices/taskSlice";
import userReducer from "./slices/userSlice";
import scheduleReducer from "./slices/scheduleSlice";
import orderReducer from "./slices/orderSlice";
import lineReducer from "./slices/lineSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    users: userReducer,
    schedules: scheduleReducer,
    orders: orderReducer,
    lines: lineReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
