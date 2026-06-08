import React from 'react';
import TaskDetail, { TASK_DETAIL_KIND_ADMIN_USER } from './Detail';

function AdminUserTaskDetailPage() {
  return <TaskDetail detailKind={TASK_DETAIL_KIND_ADMIN_USER} />;
}

export default AdminUserTaskDetailPage;
