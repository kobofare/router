import React from 'react';
import Task, { TASK_PAGE_KIND_ADMIN_USER } from './index';

function AdminUserTaskPage() {
  return <Task pageKind={TASK_PAGE_KIND_ADMIN_USER} />;
}

export default AdminUserTaskPage;
