import React from 'react';
import { Card } from 'semantic-ui-react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import GroupsManager from '../../components/GroupsManager';

const Group = () => {
  const { t } = useTranslation();
  const { id: detailGroupId } = useParams();
  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          {detailGroupId ? (
            <Card.Header className='header router-page-title'>
              {t('group_manage.detail.title')}
            </Card.Header>
          ) : null}
          <GroupsManager detailGroupId={detailGroupId || ''} />
        </Card.Content>
      </Card>
    </div>
  );
};

export default Group;
