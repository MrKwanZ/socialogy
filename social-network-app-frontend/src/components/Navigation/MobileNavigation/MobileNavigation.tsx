import NavigationItems from '../NavigationItems/NavigationItems';
import './MobileNavigation.css';

interface MobileNavigationProps {
  open: boolean;
  mobile?: boolean;
  isAuth: boolean;
  onLogout: () => void;
  onChooseItem: () => void;
}

const MobileNavigation = ({
  open,
  mobile,
  isAuth,
  onLogout,
  onChooseItem
}: MobileNavigationProps) => (
  <nav className={['mobile-nav', open ? 'open' : ''].join(' ')}>
    <ul className={['mobile-nav__items', mobile ? 'mobile' : ''].join(' ')}>
      <NavigationItems
        mobile
        onChoose={onChooseItem}
        isAuth={isAuth}
        onLogout={onLogout}
      />
    </ul>
  </nav>
);

export default MobileNavigation;
