import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/loginPage/LoginPage";
import ForgotPasswordPage from "./pages/forgotPasswordPage/ForgotPasswordPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
