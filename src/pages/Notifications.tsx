import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { NotificationsContent } from '@/components/notifications/NotificationsContent';

const Notifications: React.FC = () => {
  return (
    <Layout>
      <NotificationsContent />
    </Layout>
  );
};

export default Notifications;