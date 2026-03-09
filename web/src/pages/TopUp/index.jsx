import React, { useEffect, useState } from 'react';
import {
  Button,
  Form,
  Grid,
  Header,
  Card,
  Statistic,
} from 'semantic-ui-react';
import { API, showError, showInfo, showSuccess } from '../../helpers';
import { renderQuota } from '../../helpers/render';
import { useTranslation } from 'react-i18next';

const TopUp = () => {
  const { t } = useTranslation();
  const [redemptionCode, setRedemptionCode] = useState('');
  const [topUpLink, setTopUpLink] = useState('');
  const [userQuota, setUserQuota] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState({});

  const topUp = async () => {
    if (redemptionCode === '') {
      showInfo(t('topup.redeem_code.empty_code'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/v1/public/user/topup', {
        code: redemptionCode,
      });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('topup.redeem_code.success'));
        setUserQuota((quota) => {
          return quota + data;
        });
        setRedemptionCode('');
      } else {
        showError(message);
      }
    } catch (err) {
      showError(t('topup.redeem_code.request_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTopUpLink = () => {
    if (!topUpLink) {
      showError(t('topup.redeem_code.no_link'));
      return;
    }
    let url = new URL(topUpLink);
    let username = user.username;
    let user_id = user.id;
    url.searchParams.append('username', username);
    url.searchParams.append('user_id', user_id);
    url.searchParams.append('transaction_id', crypto.randomUUID());
    window.open(url.toString(), '_blank');
  };

  const getUserQuota = async () => {
    let res = await API.get(`/api/v1/public/user/self`);
    const { success, message, data } = res.data;
    if (success) {
      setUserQuota(data.quota);
      setUser(data);
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      if (status.top_up_link) {
        setTopUpLink(status.top_up_link);
      }
    }
    getUserQuota().then();
  }, []);

  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header>
            <Header as='h2' className='router-page-title'>{t('topup.title')}</Header>
          </Card.Header>

          <Grid columns={2} stackable>
            <Grid.Column>
              <Card
                fluid
                className='router-soft-card router-soft-card-fill'
              >
                <Card.Content className='router-card-fill'>
                  <Card.Header className='router-card-header'>
                    <Header as='h3' className='router-section-title router-title-accent-primary'>
                      <i className='credit card icon'></i>
                      {t('topup.get_code.title')}
                    </Header>
                  </Card.Header>
                  <Card.Description className='router-card-fill'>
                    <div className='router-card-body-spread'>
                      <div className='router-center-panel'>
                        <Statistic className='router-accent-statistic'>
                          <Statistic.Value>
                            {renderQuota(userQuota, t)}
                          </Statistic.Value>
                          <Statistic.Label>
                            {t('topup.get_code.current_quota')}
                          </Statistic.Label>
                        </Statistic>
                      </div>

                      <div className='router-action-footer'>
                        <Button
                          className='router-section-button router-action-button-wide'
                          primary
                          onClick={openTopUpLink}
                        >
                          {t('topup.get_code.button')}
                        </Button>
                      </div>
                    </div>
                  </Card.Description>
                </Card.Content>
              </Card>
            </Grid.Column>

            <Grid.Column>
              <Card
                fluid
                className='router-soft-card router-soft-card-fill'
              >
                <Card.Content className='router-card-fill'>
                  <Card.Header className='router-card-header'>
                    <Header as='h3' className='router-section-title router-title-accent-positive'>
                      <i className='ticket alternate icon'></i>
                      {t('topup.redeem_code.title')}
                    </Header>
                  </Card.Header>
                  <Card.Description className='router-card-fill'>
                    <div className='router-card-body-spread'>
                      <Form.Input
                        className='router-section-input'
                        fluid
                        icon='key'
                        iconPosition='left'
                        placeholder={t('topup.redeem_code.placeholder')}
                        value={redemptionCode}
                        onChange={(e) => {
                          setRedemptionCode(e.target.value);
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          setRedemptionCode(pastedText.trim());
                        }}
                        action={
                          <Button
                            className='router-section-button'
                            icon='paste'
                            content={t('topup.redeem_code.paste')}
                            onClick={async () => {
                              try {
                                const text =
                                  await navigator.clipboard.readText();
                                setRedemptionCode(text.trim());
                              } catch (err) {
                                showError(t('topup.redeem_code.paste_error'));
                              }
                            }}
                          />
                        }
                      />

                      <div className='router-action-footer'>
                        <Button
                          className='router-section-button'
                          color='green'
                          fluid
                          onClick={topUp}
                          loading={isSubmitting}
                          disabled={isSubmitting}
                        >
                          {isSubmitting
                            ? t('topup.redeem_code.submitting')
                            : t('topup.redeem_code.submit')}
                        </Button>
                      </div>
                    </div>
                  </Card.Description>
                </Card.Content>
              </Card>
            </Grid.Column>
          </Grid>
        </Card.Content>
      </Card>
    </div>
  );
};

export default TopUp;
