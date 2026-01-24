import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import DashboardPage from "./components/DashboardPage";
import TestPage from "./components/TestPage";
import ProfilePage from "./components/ProfilePage";
import ScoresPage from "./components/ScoresPage";
import SettingsPage from "./components/SettingsPage";
import ManualEvaluationPage from "./components/ManualEvaluationPage";
import PageNotFound from "./components/PageNotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* MAIN FLOW */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tests" element={<TestPage />} />
        <Route path="/manual-evaluation" element={<ManualEvaluationPage />} />

        {/* SUPPORT PAGES */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/scores" element={<ScoresPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
