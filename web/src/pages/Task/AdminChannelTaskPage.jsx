import React from 'react';
import Task, { TASK_PAGE_KIND_ADMIN_SYSTEM } from './index';

function AdminChannelTaskPage() {
  return <Task pageKind={TASK_PAGE_KIND_ADMIN_SYSTEM} />;
}

export default AdminChannelTaskPage;
