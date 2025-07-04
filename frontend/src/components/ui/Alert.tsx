import React from "react";

type AlertVariant = "success" | "info" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  message,
  onClose,
  className = "",
}) => {
  const variantStyles = {
    success: {
      container:
        "bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-500",
      icon: "text-green-400 dark:text-green-400",
      title: "text-green-800 dark:text-green-200",
      message: "text-green-700 dark:text-green-300",
    },
    info: {
      container:
        "bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500",
      icon: "text-blue-400 dark:text-blue-400",
      title: "text-blue-800 dark:text-blue-200",
      message: "text-blue-700 dark:text-blue-300",
    },
    warning: {
      container:
        "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-500",
      icon: "text-yellow-400 dark:text-yellow-400",
      title: "text-yellow-800 dark:text-yellow-200",
      message: "text-yellow-700 dark:text-yellow-300",
    },
    error: {
      container:
        "bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-500",
      icon: "text-red-400 dark:text-red-400",
      title: "text-red-800 dark:text-red-200",
      message: "text-red-700 dark:text-red-300",
    },
  };

  const styles = variantStyles[variant];

  const renderIcon = () => {
    switch (variant) {
      case "success":
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "warning":
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "error":
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={`rounded-md border-l-4 p-4 ${styles.container} ${className}`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <div className={styles.icon}>{renderIcon()}</div>
        </div>
        <div className="ml-3">
          {title && (
            <h3 className={`text-sm font-medium ${styles.title}`}>{title}</h3>
          )}
          <div className={`text-sm ${styles.message} ${title ? "mt-2" : ""}`}>
            <p>{message}</p>
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 ${styles.icon} hover:bg-opacity-20 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${variant}-50 focus:ring-${variant}-500`}
                onClick={onClose}
              >
                <span className="sr-only">Dismiss</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
