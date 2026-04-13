import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Card } from 'semantic-ui-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { API, showError, timestamp2string } from '../../helpers';
import { formatAmountWithUnit } from '../../helpers/render';

const readOnlyText = (value) => {
  const normalized = (value || '').toString().trim();
  return normalized || '-';
};

const formatDateTime = (value) => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return '-';
  }
  return timestamp2string(numericValue);
};

const formatYYC = (value) => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return '-';
  }
  return `${numericValue.toFixed(6)} YYC`;
};

const resolveListPath = (stateFrom) => {
  if (typeof stateFrom !== 'string') {
    return '/admin/flow/redemption';
  }
  const normalized = stateFrom.trim();
  if (!normalized.startsWith('/')) {
    return '/admin/flow/redemption';
  }
  if (normalized.startsWith('/admin/flow/redemption/')) {
    return '/admin/flow/redemption';
  }
  return normalized || '/admin/flow/redemption';
};

const RedemptionDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);

  const listPath = useMemo(
    () => resolveListPath(location.state?.from),
    [location.state?.from],
  );

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(
        `/api/v1/admin/flow/redemption-records/${encodeURIComponent(id)}`,
      );
      const { success, message, data } = res.data || {};
      if (!success) {
        showError(message || t('flow.messages.load_failed'));
        return;
      }
      setRecord(data || null);
    } catch (error) {
      showError(error?.message || t('flow.messages.load_failed'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadDetail().then();
  }, [loadDetail]);

  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <div className='router-entity-detail-page'>
            <div className='router-entity-detail-breadcrumb'>
              <Breadcrumb size='small'>
                <Breadcrumb.Section link onClick={() => navigate(listPath)}>
                  {t('flow.redemption.title')}
                </Breadcrumb.Section>
                <Breadcrumb.Divider icon='right chevron' />
                <Breadcrumb.Section active>
                  {readOnlyText(record?.id || id)}
                </Breadcrumb.Section>
              </Breadcrumb>
            </div>

            <div className='router-detail-section'>
              <div className='router-detail-section-title'>
                {t('flow.redemption.title')}
              </div>
              {loading ? (
                <div className='router-empty-cell'>{t('common.loading')}</div>
              ) : (
                <div className='router-detail-grid'>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('redemption.table.id')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(record?.id || id)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('user.table.username')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(
                        record?.redeemed_by_username || record?.redeemed_by_user_id,
                      )}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('redemption.table.name')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(record?.name)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('redemption.table.group')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(record?.group_name || record?.group_id)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('redemption.table.face_value')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatAmountWithUnit(
                        record?.face_value_amount || 0,
                        record?.face_value_unit || '',
                        6,
                      )}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('topup.external_topup_orders.columns.quota')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatYYC(record?.yyc_value)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('redemption.table.redeemed_time')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatDateTime(record?.redeemed_time)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('redemption.table.created_time')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatDateTime(record?.created_time)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default RedemptionDetail;
