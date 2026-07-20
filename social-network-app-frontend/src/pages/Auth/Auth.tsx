import type { ReactNode } from 'react';

import './Auth.css';

interface AuthProps {
  children: ReactNode;
}

const Auth = ({ children }: AuthProps) => (
  <section className="auth-form">{children}</section>
);

export default Auth;
