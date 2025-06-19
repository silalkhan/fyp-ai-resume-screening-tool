import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Pages
import HomePage from "./pages/HomePage";
import JobDescriptionPage from "./pages/JobDescriptionPage";
import ResumeProcessingPage from "./pages/ResumeProcessingPage";
import AllResumesPage from "./pages/AllResumesPage";
import ManageJobsPage from "./pages/ManageJobsPage";
import ErrorPage from "./pages/ErrorPage";

// Components
import { getJobCategories } from "./services/api";

const App: React.FC = () => {
  const [servicesOnline, setServicesOnline] = useState<boolean>(false);

  // Check if services are online on app startup
  useEffect(() => {
    const checkServices = async () => {
      try {
        await getJobCategories();
        setServicesOnline(true);
      } catch (error) {
        console.error("Services check failed:", error);
        setServicesOnline(false);
      }
    };

    checkServices();
  }, []);

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs/:categoryId" element={<JobDescriptionPage />} />
        <Route
          path="/resumes/:resumeId/processing"
          element={<ResumeProcessingPage />}
        />
        <Route path="/resumes/all" element={<AllResumesPage />} />
        <Route path="/jobs/manage" element={<ManageJobsPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
