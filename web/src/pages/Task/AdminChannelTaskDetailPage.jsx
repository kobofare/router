import React from 'react';
import TaskDetail, { TASK_DETAIL_KIND_ADMIN_SYSTEM } from './Detail';

function AdminChannelTaskDetailPage() {
  return <TaskDetail detailKind={TASK_DETAIL_KIND_ADMIN_SYSTEM} />;
}

export default AdminChannelTaskDetailPage;
