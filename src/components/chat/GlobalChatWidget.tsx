import { useLocation } from 'react-router-dom';
import PublicChatWidget from './PublicChatWidget';

// Routes where the chat widget should NOT appear
const EXCLUDED_ROUTES = [
  '/admin',
  '/agent',
  '/marketing',
  '/mt5-admin',
];

const GlobalChatWidget = () => {
  const location = useLocation();
  
  // Check if current route is excluded
  const isExcluded = EXCLUDED_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );
  
  if (isExcluded) {
    return null;
  }
  
  return <PublicChatWidget position="bottom-right" />;
};

export default GlobalChatWidget;
