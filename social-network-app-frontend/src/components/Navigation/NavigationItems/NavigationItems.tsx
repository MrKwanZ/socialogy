import { NavLink } from 'react-router-dom';

import './NavigationItems.css';

interface NavItem {
  id: string;
  text: string;
  link: string;
  auth: boolean;
}

interface NavigationItemsProps {
  isAuth: boolean;
  onLogout: () => void;
  mobile?: boolean;
  onChoose?: () => void;
}

const navItems: NavItem[] = [
  { id: 'feed', text: 'Feed', link: '/', auth: true },
  { id: 'login', text: 'Login', link: '/', auth: false },
  { id: 'signup', text: 'Signup', link: '/signup', auth: false }
];

const NavigationItems = ({
  isAuth,
  onLogout,
  mobile,
  onChoose
}: NavigationItemsProps) => [
  ...navItems
    .filter((item) => item.auth === isAuth)
    .map((item) => (
      <li
        key={item.id}
        className={['navigation-item', mobile ? 'mobile' : ''].join(' ')}
      >
        <NavLink to={item.link} end onClick={onChoose}>
          {item.text}
        </NavLink>
      </li>
    )),
  isAuth && (
    <li className="navigation-item" key="logout">
      <button onClick={onLogout}>Logout</button>
    </li>
  )
];

export default NavigationItems;
