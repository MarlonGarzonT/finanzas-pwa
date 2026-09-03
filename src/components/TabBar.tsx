import { NavLink } from 'react-router-dom';
import './TabBar.css';

const IconResumen = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 13a8 8 0 1 1 16 0" strokeLinecap="round" />
    <path d="M12 13l4-4" strokeLinecap="round" />
    <path d="M3 20h18" strokeLinecap="round" />
  </svg>
);

const IconHistorial = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
  </svg>
);

export function TabBar() {
  return (
    <nav className="tab-bar">
      <NavLink to="/" end className={({ isActive }) => `tab-bar__item ${isActive ? 'tab-bar__item--activo' : ''}`}>
        <IconResumen />
        <span>Resumen</span>
      </NavLink>
      <NavLink
        to="/historial"
        className={({ isActive }) => `tab-bar__item ${isActive ? 'tab-bar__item--activo' : ''}`}
      >
        <IconHistorial />
        <span>Historial</span>
      </NavLink>
    </nav>
  );
}
