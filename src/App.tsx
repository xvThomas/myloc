import { BrowserRouter, Routes, Route } from "react-router";
import HomePage from "./pages/HomePage";
import DriverPage from "./pages/DriverPage";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";

export default function App() {
  return (
    <BrowserRouter>
      <PWAUpdatePrompt />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/driver" element={<DriverPage />} />
      </Routes>
    </BrowserRouter>
  );
}
