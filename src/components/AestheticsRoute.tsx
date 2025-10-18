import { Navigate, Outlet } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';

const AestheticsRoute: React.FC = () => {
  const { globals } = useGlobal();

  if (!globals.aesthetics_module_enabled) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AestheticsRoute;
