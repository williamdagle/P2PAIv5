import React from 'react';
import Notification from './Notification';
import { useNotificationContext } from '../context/NotificationContext';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotificationContext();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
