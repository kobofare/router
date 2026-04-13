import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Card, Label } from 'semantic-ui-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { API, showError, timestamp2string } from '../../helpers';

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

const formatAmount = (row) =>
  Number(row?.amount || 0) > 0
    ? `${readOnlyText(row?.currency)} ${Number(row?.amount || 0).toFixed(6)}`
    : '-';

const formatYYC = (value) => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return '-';
  }
  return `${numericValue.toFixed(6)} YYC`;
};

const normalizeTopupStatus = (value) =>
  (value || '').toString().trim().toLowerCase();

const renderTopupStatus = (status, t) => {
  switch (normalizeTopupStatus(status)) {
    case 'created':
      return (
        <Label basic className='router-tag'>
          {t('topup.external_topup_orders.status.created')}
        </Label>
      );
    case 'pending':
      return (
        <Label basic color='blue' className='router-tag'>
          {t('topup.external_topup_orders.status.pending')}
        </Label>
      );
    case 'paid':
      return (
        <Label basic color='teal' className='router-tag'>
          {t('topup.external_topup_orders.status.paid')}
        </Label>
      );
    case 'fulfilled':
      return (
        <Label basic color='green' className='router-tag'>
          {t('topup.external_topup_orders.status.fulfilled')}
        </Label>
      );
    case 'failed':
      return (
        <Label basic color='red' className='router-tag'>
          {t('topup.external_topup_orders.status.failed')}
        </Label>
      );
    case 'canceled':
      return (
        <Label basic color='grey' className='router-tag'>
          {t('topup.external_topup_orders.status.canceled')}
        </Label>
      );
    default:
      return (
        <Label basic color='grey' className='router-tag'>
          {readOnlyText(status)}
        </Label>
      );
  }
};

const resolveListPath = (stateFrom) => {
  if (typeof stateFrom !== 'string') {
    return '/admin/flow/topup';
  }
  const normalized = stateFrom.trim();
  if (!normalized.startsWith('/')) {
    return '/admin/flow/topup';
  }
  if (normalized.startsWith('/admin/flow/topup/')) {
    return '/admin/flow/topup';
  }
  return normalized || '/admin/flow/topup';
};

const TopupDetail = () => {
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
        `/api/v1/admin/flow/topup-orders/${encodeURIComponent(id)}`,
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
                  {t('flow.topup.title')}
                </Breadcrumb.Section>
                <Breadcrumb.Divider icon='right chevron' />
                <Breadcrumb.Section active>
                  {readOnlyText(record?.id || id)}
                </Breadcrumb.Section>
              </Breadcrumb>
            </div>

            <div className='router-detail-section'>
              <div className='router-detail-section-title'>
                {t('flow.topup.title')}
              </div>
              {loading ? (
                <div className='router-empty-cell'>{t('common.loading')}</div>
              ) : (
                <div className='router-detail-grid'>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.id')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(record?.id || id)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.user')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(record?.username || record?.user_id)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('topup.external_topup_orders.columns.status')}
                    </div>
                    <div className='router-detail-value'>
                      {renderTopupStatus(record?.status, t)}
                    </div>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup.columns.source')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(record?.provider_name || record?.source)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('topup.external_topup_orders.columns.amount')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatAmount(record)}
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
                      {t('topup.external_topup_orders.columns.transaction_id')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(record?.transaction_id)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('topup.external_topup_orders.fields.provider_order_id')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(record?.provider_order_id)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('user.table.created_at')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatDateTime(record?.created_at)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('user.table.updated_at')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatDateTime(record?.updated_at)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.paid_at')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatDateTime(record?.paid_at)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.redeemed_at')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatDateTime(record?.redeemed_at)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className='router-detail-section'>
              <div className='router-detail-section-title'>
                {t('flow.topup_reconcile.detail.sections.message')}
              </div>
              <pre className='router-detail-pre'>
                {readOnlyText(record?.status_message)}
              </pre>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default TopupDetail;
