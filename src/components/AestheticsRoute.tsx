import { Navigate, Outlet } from 'react-router-dom';
import { useClinic } from '../context/ClinicContext';

const AestheticsRoute: React.FC = () => {
  const { aestheticsEnabled } = useClinic();

  if (!aestheticsEnabled) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AestheticsRoute;
