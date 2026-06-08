import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminChannelAlertsPanel from '../../components/AdminChannelAlertsPanel';
import { AppFilterHeader } from '../../router-ui';
import '../Dashboard/Dashboard.css';
import '../AdminDashboard/AdminDashboard.css';

function AdminAlerts() {
  const { t } = useTranslation();

  return (
    <div className='dashboard-container admin-dashboard-container'>
      <AppFilterHeader
        className='admin-dashboard-toolbar'
        breadcrumbs={[
          { key: 'dashboard', label: t('header.system_overview') },
          { key: 'alerts', label: t('dashboard.admin.nav.alerts'), active: true },
        ]}
      />
      <AdminChannelAlertsPanel />
    </div>
  );
}

export default AdminAlerts;
