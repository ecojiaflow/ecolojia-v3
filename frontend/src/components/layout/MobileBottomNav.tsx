import { Home, Camera, MessageCircle, Clock } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const MobileBottomNav = () => {
  const navItems = [
    { icon: Home, label: 'Accueil', to: '/' },
    { icon: Camera, label: 'Scanner', to: '/scan', primary: true },
    { icon: MessageCircle, label: 'Chat IA', to: '/chat' },
    { icon: Clock, label: 'Historique', to: '/history' }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 md:hidden">
      {navItems.map(({ icon: Icon, label, to, primary }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `
            flex flex-col items-center justify-center py-2 px-3 transition-all
            ${isActive ? 'text-green-600' : 'text-gray-600'}
            ${primary ? 'scale-110' : ''}
          `}
        >
          <Icon size={primary ? 28 : 24} strokeWidth={primary ? 2.5 : 2} />
          <span className="text-xs mt-1 font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};