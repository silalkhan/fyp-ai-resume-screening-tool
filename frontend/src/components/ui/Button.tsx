import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";

  const variantClasses = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 border border-transparent",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 border border-transparent",
    outline:
      "bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 border border-gray-300",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const fullWidthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled ? "opacity-60 cursor-not-allowed" : "";

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidthClass} ${disabledClass} ${className}`;

  return (
    <button className={combinedClasses} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;
