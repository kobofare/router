import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Statistic } from 'semantic-ui-react';
import { useTopUpWorkspace } from './shared.jsx';

const BalanceStatusPage = () => {
  const { t } = useTranslation();
  const { userBalanceYYC, renderDisplayAmount } = useTopUpWorkspace();

  return (
    <Card fluid className='router-soft-card router-soft-card-fill'>
      <Card.Content className='router-card-fill'>
        <Card.Description className='router-card-fill'>
          <div className='router-card-body-spread'>
            <div className='router-center-panel'>
              <Statistic className='router-accent-statistic'>
                <Statistic.Value>
                  {renderDisplayAmount(userBalanceYYC)}
                </Statistic.Value>
                <Statistic.Label>
                  {t('topup.external_topup.current_balance')}
                </Statistic.Label>
              </Statistic>
            </div>
          </div>
        </Card.Description>
      </Card.Content>
    </Card>
  );
};

export default BalanceStatusPage;
