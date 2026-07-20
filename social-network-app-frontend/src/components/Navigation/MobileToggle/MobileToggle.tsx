import './MobileToggle.css';

interface MobileToggleProps {
  onOpen: () => void;
}

const MobileToggle = ({ onOpen }: MobileToggleProps) => (
  <button className="mobile-toggle" onClick={onOpen}>
    <span className="mobile-toggle__bar" />
    <span className="mobile-toggle__bar" />
    <span className="mobile-toggle__bar" />
  </button>
);

export default MobileToggle;
