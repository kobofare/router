import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Button, Card, Label } from 'semantic-ui-react';
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

const formatTopupBusinessType = (type, t) => {
  switch ((type || '').toString().trim()) {
    case 'balance_topup':
      return t('topup.business_type.balance_topup');
    case 'package_purchase':
      return t('topup.business_type.package_purchase');
    default:
      return readOnlyText(type);
  }
};

const renderReconcileStage = (row, t) => {
  const status = normalizeTopupStatus(row?.status);
  switch (status) {
    case 'created':
      return (
        <Label basic className='router-tag'>
          {t('flow.topup_reconcile.stage.awaiting_payment')}
        </Label>
      );
    case 'pending':
      return (
        <Label basic color='blue' className='router-tag'>
          {t('flow.topup_reconcile.stage.payment_processing')}
        </Label>
      );
    case 'paid':
      return (
        <Label basic color='orange' className='router-tag'>
          {t('flow.topup_reconcile.stage.awaiting_fulfillment')}
        </Label>
      );
    case 'fulfilled':
      return (
        <Label basic color='green' className='router-tag'>
          {t('flow.topup_reconcile.stage.done')}
        </Label>
      );
    case 'failed':
    case 'canceled':
      return (
        <Label basic color='grey' className='router-tag'>
          {t('flow.topup_reconcile.stage.closed')}
        </Label>
      );
    default:
      return (
        <Label basic color='grey' className='router-tag'>
          {readOnlyText(row?.status)}
        </Label>
      );
  }
};

const formatAmount = (row) =>
  Number(row?.amount || 0) > 0
    ? `${readOnlyText(row?.currency || 'CNY')} ${Number(row?.amount || 0).toFixed(2)}`
    : '-';

const resolveListPath = (stateFrom) => {
  if (typeof stateFrom !== 'string') {
    return '/admin/flow/topup-reconcile';
  }
  const normalized = stateFrom.trim();
  if (!normalized.startsWith('/')) {
    return '/admin/flow/topup-reconcile';
  }
  if (normalized.startsWith('/admin/flow/topup-reconcile/')) {
    return '/admin/flow/topup-reconcile';
  }
  return normalized || '/admin/flow/topup-reconcile';
};

const TopupReconcileDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState(null);

  const listPath = useMemo(
    () => resolveListPath(location.state?.from),
    [location.state?.from],
  );

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(
        `/api/v1/admin/flow/topup-reconcile-records/${encodeURIComponent(id)}`,
      );
      const { success, message, data } = res.data || {};
      if (!success) {
        showError(message || t('flow.topup_reconcile.detail.messages.load_failed'));
        return;
      }
      setOrder(data || null);
    } catch (error) {
      showError(error?.message || t('flow.topup_reconcile.detail.messages.load_failed'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  const handleRefresh = useCallback(async () => {
    if (!id) {
      return;
    }
    setRefreshing(true);
    try {
      const res = await API.post(
        `/api/v1/admin/flow/topup-reconcile-records/${encodeURIComponent(id)}/refresh`,
      );
      const { success, message, data } = res.data || {};
      if (!success) {
        showError(message || t('flow.topup_reconcile.detail.messages.refresh_failed'));
        return;
      }
      setOrder(data || null);
    } catch (error) {
      showError(error?.message || t('flow.topup_reconcile.detail.messages.refresh_failed'));
    } finally {
      setRefreshing(false);
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
                  {t('flow.topup_reconcile.title')}
                </Breadcrumb.Section>
                <Breadcrumb.Divider icon='right chevron' />
                <Breadcrumb.Section active>
                  {readOnlyText(order?.id || id)}
                </Breadcrumb.Section>
              </Breadcrumb>
            </div>

            <div className='router-detail-section'>
              <div className='router-entity-detail-section-header'>
                <div className='router-detail-section-title'>
                  {t('flow.topup_reconcile.detail.sections.basic')}
                </div>
                <div className='router-toolbar-start'>
                  <Button
                    className='router-page-button'
                    onClick={loadDetail}
                    loading={loading}
                    disabled={loading}
                  >
                    {t('task.buttons.refresh')}
                  </Button>
                  <Button
                    className='router-page-button'
                    onClick={handleRefresh}
                    loading={refreshing}
                    disabled={refreshing}
                  >
                    {t('flow.topup_reconcile.actions.refresh')}
                  </Button>
                </div>
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
                      {readOnlyText(order?.id || id)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.user')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(order?.username || order?.user_id)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.business_type')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatTopupBusinessType(order?.business_type, t)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.amount')}
                    </div>
                    <pre className='router-detail-value'>{formatAmount(order)}</pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.stage')}
                    </div>
                    <div className='router-detail-value'>
                      {renderReconcileStage(order, t)}
                    </div>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.status')}
                    </div>
                    <div className='router-detail-value'>
                      {renderTopupStatus(order?.status, t)}
                    </div>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.title')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(order?.title)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.source')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(order?.provider_name || order?.source)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.transaction_id')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(order?.transaction_id)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.provider_order_id')}
                    </div>
                    <pre className='router-detail-value'>
                      {readOnlyText(order?.provider_order_id)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.created_at')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatDateTime(order?.created_at)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.updated_at')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatDateTime(order?.updated_at)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.paid_at')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatDateTime(order?.paid_at)}
                    </pre>
                  </div>
                  <div className='router-detail-item'>
                    <div className='router-detail-label'>
                      {t('flow.topup_reconcile.detail.fields.redeemed_at')}
                    </div>
                    <pre className='router-detail-value'>
                      {formatDateTime(order?.redeemed_at)}
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
                {readOnlyText(order?.status_message)}
              </pre>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default TopupReconcileDetail;
