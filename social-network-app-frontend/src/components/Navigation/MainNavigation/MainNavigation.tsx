import { NavLink } from 'react-router-dom';

import MobileToggle from '../MobileToggle/MobileToggle';
import Logo from '../../Logo/Logo';
import NavigationItems from '../NavigationItems/NavigationItems';

import './MainNavigation.css';

interface MainNavigationProps {
  isAuth: boolean;
  onLogout: () => void;
  onOpenMobileNav: () => void;
}

const MainNavigation = ({
  isAuth,
  onLogout,
  onOpenMobileNav
}: MainNavigationProps) => (
  <nav className="main-nav">
    <MobileToggle onOpen={onOpenMobileNav} />
    <div className="main-nav__logo">
      <NavLink to="/" end>
        <Logo />
      </NavLink>
    </div>
    <div className="spacer" />
    <ul className="main-nav__items">
      <NavigationItems isAuth={isAuth} onLogout={onLogout} />
    </ul>
  </nav>
);

export default MainNavigation;
