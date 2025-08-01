import React from 'react';
import { AuthPage } from '../auth/components/AuthPage';

const RegisterPage: React.FC = () => {
  return <AuthPage defaultMode="register" />;
};

export default RegisterPage;