import React from 'react';
import { AuthPage } from '../auth/components/AuthPage';

const LoginPage: React.FC = () => {
  return <AuthPage defaultMode="login" />;
};

export default LoginPage;