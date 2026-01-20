import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import taskReducer from "./slices/taskSlice";
import userReducer from "./slices/userSlice";
import scheduleReducer from "./slices/scheduleSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    users: userReducer,
    schedules: scheduleReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
