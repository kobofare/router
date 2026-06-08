import React from 'react';
import Task, { TASK_PAGE_KIND_WORKSPACE_USER } from './index';

function WorkspaceTaskPage() {
  return <Task pageKind={TASK_PAGE_KIND_WORKSPACE_USER} />;
}

export default WorkspaceTaskPage;
