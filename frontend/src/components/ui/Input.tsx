import React from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input: React.FC<InputProps> = ({
  className,
  label,
  error,
  helpText,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          "block w-full rounded-md shadow-sm sm:text-sm",
          "border-gray-300 focus:border-primary-500 focus:ring-primary-500",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : helpText ? (
        <p className="text-sm text-gray-500">{helpText}</p>
      ) : null}
    </div>
  );
};

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  className,
  label,
  error,
  helpText,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx(
          "block w-full rounded-md shadow-sm sm:text-sm",
          "border-gray-300 focus:border-primary-500 focus:ring-primary-500",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : helpText ? (
        <p className="text-sm text-gray-500">{helpText}</p>
      ) : null}
    </div>
  );
};
