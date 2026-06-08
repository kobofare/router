import React from 'react';
import TaskDetail, { TASK_DETAIL_KIND_WORKSPACE_USER } from './Detail';

function WorkspaceTaskDetailPage() {
  return <TaskDetail detailKind={TASK_DETAIL_KIND_WORKSPACE_USER} />;
}

export default WorkspaceTaskDetailPage;
