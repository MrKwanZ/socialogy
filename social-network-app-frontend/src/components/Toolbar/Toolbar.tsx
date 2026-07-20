import type { ReactNode } from 'react';

import './Toolbar.css';

interface ToolbarProps {
  children: ReactNode;
}

const Toolbar = ({ children }: ToolbarProps) => (
  <div className="toolbar">{children}</div>
);

export default Toolbar;
