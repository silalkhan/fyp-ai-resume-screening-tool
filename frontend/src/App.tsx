import React, { useEffect, useState, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Context
import { DarkModeProvider, useDarkMode } from "./context/DarkModeContext";

// Layout
import Layout from "./components/layout/Layout";

// Pages
import HomePage from "./pages/HomePage";
import JobDescriptionPage from "./pages/JobDescriptionPage";
import ResumeProcessingPage from "./pages/ResumeProcessingPage";
import AllResumesPage from "./pages/AllResumesPage";
import ManageJobsPage from "./pages/ManageJobsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ErrorPage from "./pages/ErrorPage";

// Services
import {
  getJobCategories,
  checkBackendHealth,
  checkNlpHealth,
} from "./services/api";

// Toast wrapper component to use the darkMode context
const ToastWrapper = () => {
  const { darkMode } = useDarkMode();
  return (
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
      theme={darkMode ? "dark" : "light"}
      limit={3} // Limit the number of toasts shown at once
    />
  );
};

const App: React.FC = () => {
  const [servicesOnline, setServicesOnline] = useState({
    backend: false,
    nlp: false,
  });

  // Use refs to track previous status to avoid duplicate notifications
  const prevStatusRef = useRef({ backend: false, nlp: false });

  // Flag to track if this is the first check
  const isFirstCheck = useRef(true);

  // Function to check service health
  const checkServices = async () => {
    try {
      // Check backend service
      const backendStatus = await checkBackendHealth();
      const nlpStatus = await checkNlpHealth();

      // Store current status
      const newStatus = {
        backend: backendStatus.isHealthy,
        nlp: nlpStatus.isHealthy,
      };

      // Only show notifications if status has changed or it's the first check
      if (isFirstCheck.current) {
        // On first check, only show notifications if services are offline
        if (!backendStatus.isHealthy) {
          toast.error(
            "Backend service is offline. Some features may not work."
          );
        }
        if (!nlpStatus.isHealthy) {
          toast.error(
            "NLP service is offline. Resume processing may not work."
          );
        }
        isFirstCheck.current = false;
      } else {
        // For subsequent checks, only notify on status changes
        if (prevStatusRef.current.backend !== newStatus.backend) {
          if (newStatus.backend) {
            toast.success("Backend service is now online.");
          } else {
            toast.error(
              "Backend service is offline. Some features may not work."
            );
          }
        }

        if (prevStatusRef.current.nlp !== newStatus.nlp) {
          if (newStatus.nlp) {
            toast.success("NLP service is now online.");
          } else {
            toast.error(
              "NLP service is offline. Resume processing may not work."
            );
          }
        }
      }

      // Update the previous status for the next check
      prevStatusRef.current = newStatus;

      // Update state for UI
      setServicesOnline(newStatus);

      if (backendStatus.isHealthy && nlpStatus.isHealthy) {
        // Services are online, fetch initial data
        await getJobCategories();
        console.log("All services are online");
      }
    } catch (error) {
      console.error("Services check failed:", error);
      // Only show this error if we haven't already shown offline messages
      if (servicesOnline.backend || servicesOnline.nlp) {
        toast.error("Failed to connect to services. Please try again later.");
      }
    }
  };

  useEffect(() => {
    // Initial check
    checkServices();

    // Set up periodic checking every 30 seconds
    const intervalId = setInterval(() => {
      checkServices();
    }, 30000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <DarkModeProvider>
      <Router>
        <ToastWrapper />
        <Routes>
          <Route element={<Layout servicesStatus={servicesOnline} />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/jobs/:categoryId" element={<JobDescriptionPage />} />
            <Route
              path="/resumes/:resumeId/processing"
              element={<ResumeProcessingPage />}
            />
            <Route path="/resumes/all" element={<AllResumesPage />} />
            <Route path="/jobs/manage" element={<ManageJobsPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </DarkModeProvider>
  );
};

export default App;
