import React, { useState, useEffect } from "react";
import { checkBackendHealth, checkNlpHealth } from "../../services/api";

type ServiceStatus = "online" | "offline" | "checking";

interface HeaderProps {
  title: string;
}

interface ServiceIndicatorProps {
  label: string;
  status: ServiceStatus;
  message: string;
}

const ServiceIndicator: React.FC<ServiceIndicatorProps> = ({
  label,
  status,
  message,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800";
      case "offline":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex items-center tooltip" title={message}>
      <span className="mr-2 text-sm text-gray-600">{label}:</span>
      <span
        className={`
        inline-flex items-center 
        px-2.5 py-0.5 
        rounded-full text-xs font-medium 
        ${getStatusColor()}
      `}
      >
        {status}
      </span>
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [backendStatus, setBackendStatus] = useState<ServiceStatus>("checking");
  const [nlpStatus, setNlpStatus] = useState<ServiceStatus>("checking");
  const [statusMessages, setStatusMessages] = useState({
    backend: "",
    nlp: "",
  });

  useEffect(() => {
    let mounted = true;

    const checkServices = async () => {
      if (!mounted) return;

      try {
        // Check backend health
        const backendHealth = await checkBackendHealth();
        if (!mounted) return;

        setBackendStatus(backendHealth.isHealthy ? "online" : "offline");
        setStatusMessages((prev) => ({
          ...prev,
          backend:
            backendHealth.message ||
            (backendHealth.isHealthy
              ? "Service is healthy"
              : "Service is unavailable"),
        }));

        // Check NLP service health
        const nlpHealth = await checkNlpHealth();
        if (!mounted) return;

        setNlpStatus(nlpHealth.isHealthy ? "online" : "offline");
        setStatusMessages((prev) => ({
          ...prev,
          nlp:
            nlpHealth.message ||
            (nlpHealth.isHealthy
              ? "Service is healthy"
              : "Service is unavailable"),
        }));
      } catch (error) {
        if (!mounted) return;

        console.error("Error checking services:", error);
        setBackendStatus("offline");
        setNlpStatus("offline");
        setStatusMessages({
          backend: "Service unreachable",
          nlp: "Service unreachable",
        });
      }
    };

    // Initial check and start polling
    checkServices();
    const intervalId = setInterval(checkServices, 30000);

    // Cleanup on unmount
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <div className="flex items-center space-x-6">
            <ServiceIndicator
              label="Backend"
              status={backendStatus}
              message={statusMessages.backend}
            />
            <ServiceIndicator
              label="NLP Service"
              status={nlpStatus}
              message={statusMessages.nlp}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
