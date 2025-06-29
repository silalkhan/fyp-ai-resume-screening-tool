import React from "react";
import clsx from "clsx";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div
      className={clsx(
        "bg-white dark:bg-gray-800 rounded-lg shadow-soft dark:shadow-lg overflow-hidden transition-colors duration-300",
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  children,
}) => {
  return (
    <div
      className={clsx(
        "px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors duration-300",
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({
  className,
  children,
}) => {
  return <div className={clsx("px-6 py-4", className)}>{children}</div>;
};

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  className,
  children,
}) => {
  return (
    <div
      className={clsx(
        "px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300",
        className
      )}
    >
      {children}
    </div>
  );
};
