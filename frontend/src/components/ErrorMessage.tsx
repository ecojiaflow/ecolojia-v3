// PATH: frontend/src/components/ErrorMessage.tsx
import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="p-4 bg-red-100 text-red-700 rounded-md text-center">
    {message}
  </div>
);

export default ErrorMessage;
