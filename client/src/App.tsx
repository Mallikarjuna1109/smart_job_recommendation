import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { DbStatusBanner } from "./components/DbStatusBanner";
import { Dashboard } from "./pages/Dashboard";
import { Recommendations } from "./pages/Recommendations";
import { JobDetails } from "./pages/JobDetails";
import { CandidateProfile } from "./pages/CandidateProfile";
import { CandidateProvider } from "./context/CandidateContext";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <CandidateProvider>
        <div className="min-h-screen bg-canvas">
          <DbStatusBanner />
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/jobs/:jobId" element={<JobDetails />} />
              <Route path="/profile" element={<CandidateProfile />} />
            </Routes>
          </main>
        </div>
      </CandidateProvider>
    </ThemeProvider>
  );
}
