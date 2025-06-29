import React from "react";

interface LoadingProps {
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "white";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = "medium",
  color = "primary",
  text,
  fullScreen = false,
  className = "",
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  const colorClasses = {
    primary: "text-primary-600",
    secondary: "text-gray-600",
    white: "text-white",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50"
    : `flex flex-col items-center justify-center ${className}`;

  return (
    <div className={containerClasses}>
      <div className="animate-spin">
        <svg
          className={`${sizeClasses[size]} ${colorClasses[color]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
    </div>
  );
};

export default Loading;
