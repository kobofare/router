import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Dropdown, Label, Table } from 'semantic-ui-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { API } from '../../helpers/api';
import '../Dashboard/Dashboard.css';
import './AdminDashboard.css';

const PERIOD_OPTIONS = [
  'today',
  'last_7_days',
  'last_30_days',
  'this_month',
  'last_month',
  'this_year',
  'all_time',
];

const TREND_METRIC_OPTIONS = ['consume_quota', 'topup_quota', 'request_count', 'active_user_count'];

const TASK_TYPE_KEYS = {
  channel_model_test: 'channel_model_test',
  channel_refresh_models: 'channel_refresh_models',
  channel_refresh_balance: 'channel_refresh_balance',
};

const EMPTY_SUMMARY = {
  consume_quota: 0,
  topup_quota: 0,
  net_quota: 0,
  request_count: 0,
  active_user_count: 0,
  channel_total: 0,
  channel_enabled: 0,
  channel_disabled: 0,
  group_total: 0,
  provider_total: 0,
  task_active_total: 0,
  task_failed_total: 0,
};

const EMPTY_DASHBOARD = {
  period: 'last_7_days',
  granularity: 'day',
  start_timestamp: 0,
  end_timestamp: 0,
  summary: EMPTY_SUMMARY,
  trend: [],
  top_channels: [],
  recent_tasks: [],
  generated_at: 0,
};

const getQuotaPerUnit = () => {
  const raw = parseFloat(localStorage.getItem('quota_per_unit') || '1');
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  return raw;
};

const toUsd = (quota) => {
  const value = Number(quota);
  if (!Number.isFinite(value)) return 0;
  return value / getQuotaPerUnit();
};

const formatUsd = (quota) => {
  const amount = toUsd(quota);
  if (!Number.isFinite(amount)) return '0.0000';
  return amount.toFixed(4);
};

const formatCount = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('zh-CN');
};

const statusColor = (status) => {
  switch (status) {
    case 1:
      return 'green';
    case 2:
      return 'grey';
    case 3:
      return 'orange';
    case 4:
      return 'blue';
    default:
      return 'grey';
  }
};

const taskStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'yellow';
    case 'running':
      return 'blue';
    case 'succeeded':
      return 'green';
    case 'failed':
      return 'red';
    case 'canceled':
      return 'grey';
    default:
      return 'grey';
  }
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('last_7_days');
  const [loading, setLoading] = useState(false);
  const [trendMetric, setTrendMetric] = useState('consume_quota');
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);

  const periodOptions = useMemo(
    () =>
      PERIOD_OPTIONS.map((value) => ({
        key: value,
        value,
        text: t(`dashboard.spending.period.${value}`),
      })),
    [t]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/v1/admin/dashboard/', {
        params: { period },
      });
      if (res.data?.success) {
        const payload = res.data.data || {};
        setDashboard({
          ...EMPTY_DASHBOARD,
          ...payload,
          summary: {
            ...EMPTY_SUMMARY,
            ...(payload.summary || {}),
          },
          trend: Array.isArray(payload.trend) ? payload.trend : [],
          top_channels: Array.isArray(payload.top_channels) ? payload.top_channels : [],
          recent_tasks: Array.isArray(payload.recent_tasks) ? payload.recent_tasks : [],
        });
      } else {
        setDashboard(EMPTY_DASHBOARD);
      }
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
      setDashboard(EMPTY_DASHBOARD);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatUpdatedAt = (value) => {
    if (!value) return '-';
    return new Date(Number(value) * 1000).toLocaleString('zh-CN', { hour12: false });
  };

  const renderCapabilities = (raw) => {
    if (!Array.isArray(raw) || raw.length === 0) return '-';
    return raw
      .map((item) => t(`dashboard.admin.capabilities.${item}`, { defaultValue: item }))
      .join(' / ');
  };

  const trendLineColor = useMemo(() => {
    switch (trendMetric) {
      case 'topup_quota':
        return '#16a34a';
      case 'request_count':
        return '#2563eb';
      case 'active_user_count':
        return '#9333ea';
      default:
        return '#ea580c';
    }
  }, [trendMetric]);

  const trendFormatter = (value) => {
    if (trendMetric === 'consume_quota' || trendMetric === 'topup_quota') {
      return formatUsd(value);
    }
    return formatCount(value);
  };

  return (
    <div className='dashboard-container admin-dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header className='router-card-header router-section-title'>
            {t('dashboard.admin.title')}
          </Card.Header>
          <div className='admin-dashboard-toolbar'>
            <div className='admin-dashboard-period'>
              <span className='admin-dashboard-period-label'>
                {t('dashboard.admin.period.label')}
              </span>
              <Dropdown
                className='router-section-dropdown'
                selection
                options={periodOptions}
                value={period}
                onChange={(e, { value }) => setPeriod(value)}
              />
            </div>
            <div className='admin-dashboard-toolbar-right'>
              <span className='admin-dashboard-updated'>
                {t('dashboard.admin.updated_at', { time: formatUpdatedAt(dashboard.generated_at) })}
              </span>
              <Button
                className='router-inline-button'
                type='button'
                loading={loading}
                onClick={loadData}
              >
                {t('dashboard.admin.buttons.refresh')}
              </Button>
            </div>
          </div>
          <div className='admin-dashboard-kpi-grid'>
            <div className='admin-dashboard-kpi-item'>
              <div className='admin-dashboard-kpi-label'>{t('dashboard.admin.metrics.consume')}</div>
              <div className='admin-dashboard-kpi-value'>{formatUsd(dashboard.summary.consume_quota)}</div>
            </div>
            <div className='admin-dashboard-kpi-item'>
              <div className='admin-dashboard-kpi-label'>{t('dashboard.admin.metrics.topup')}</div>
              <div className='admin-dashboard-kpi-value'>{formatUsd(dashboard.summary.topup_quota)}</div>
            </div>
            <div className='admin-dashboard-kpi-item'>
              <div className='admin-dashboard-kpi-label'>{t('dashboard.admin.metrics.net')}</div>
              <div className='admin-dashboard-kpi-value'>{formatUsd(dashboard.summary.net_quota)}</div>
            </div>
            <div className='admin-dashboard-kpi-item'>
              <div className='admin-dashboard-kpi-label'>{t('dashboard.admin.metrics.request_count')}</div>
              <div className='admin-dashboard-kpi-value'>{formatCount(dashboard.summary.request_count)}</div>
            </div>
            <div className='admin-dashboard-kpi-item'>
              <div className='admin-dashboard-kpi-label'>{t('dashboard.admin.metrics.active_user_count')}</div>
              <div className='admin-dashboard-kpi-value'>{formatCount(dashboard.summary.active_user_count)}</div>
            </div>
            <div className='admin-dashboard-kpi-item'>
              <div className='admin-dashboard-kpi-label'>{t('dashboard.admin.metrics.channels')}</div>
              <div className='admin-dashboard-kpi-value'>
                {dashboard.summary.channel_enabled} / {dashboard.summary.channel_total}
              </div>
            </div>
            <div className='admin-dashboard-kpi-item'>
              <div className='admin-dashboard-kpi-label'>{t('dashboard.admin.metrics.channel_disabled')}</div>
              <div className='admin-dashboard-kpi-value'>{formatCount(dashboard.summary.channel_disabled)}</div>
            </div>
            <div className='admin-dashboard-kpi-item'>
              <div className='admin-dashboard-kpi-label'>{t('dashboard.admin.metrics.groups')}</div>
              <div className='admin-dashboard-kpi-value'>{formatCount(dashboard.summary.group_total)}</div>
            </div>
            <div className='admin-dashboard-kpi-item'>
              <div className='admin-dashboard-kpi-label'>{t('dashboard.admin.metrics.providers')}</div>
              <div className='admin-dashboard-kpi-value'>{formatCount(dashboard.summary.provider_total)}</div>
            </div>
            <div className='admin-dashboard-kpi-item'>
              <div className='admin-dashboard-kpi-label'>{t('dashboard.admin.metrics.tasks_active')}</div>
              <div className='admin-dashboard-kpi-value'>{formatCount(dashboard.summary.task_active_total)}</div>
            </div>
            <div className='admin-dashboard-kpi-item'>
              <div className='admin-dashboard-kpi-label'>{t('dashboard.admin.metrics.tasks_failed')}</div>
              <div className='admin-dashboard-kpi-value'>{formatCount(dashboard.summary.task_failed_total)}</div>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card fluid className='chart-card admin-dashboard-section'>
        <Card.Content>
          <Card.Header className='router-card-header router-section-title'>
            {t('dashboard.admin.sections.trend')}
          </Card.Header>
          <div className='admin-dashboard-trend-toolbar'>
            <Button.Group>
              {TREND_METRIC_OPTIONS.map((metric) => (
                <Button
                  key={metric}
                  className='router-inline-button'
                  active={trendMetric === metric}
                  onClick={() => setTrendMetric(metric)}
                >
                  {t(`dashboard.admin.trend.metrics.${metric}`)}
                </Button>
              ))}
            </Button.Group>
          </div>
          {dashboard.trend.length === 0 ? (
            <div className='admin-dashboard-empty'>{t('dashboard.admin.empty.trend')}</div>
          ) : (
            <div className='chart-container'>
              <ResponsiveContainer width='100%' height={240}>
                <LineChart data={dashboard.trend}>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} opacity={0.1} />
                  <XAxis
                    dataKey='bucket'
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#A3AED0' }}
                    minTickGap={8}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A3AED0' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value) => [trendFormatter(value), t(`dashboard.admin.trend.metrics.${trendMetric}`)]}
                    labelFormatter={(label) => `${t('dashboard.statistics.tooltip.date')}: ${label}`}
                  />
                  <Line
                    type='monotone'
                    dataKey={trendMetric}
                    stroke={trendLineColor}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card.Content>
      </Card>

      <Card fluid className='chart-card admin-dashboard-section'>
        <Card.Content>
          <Card.Header className='router-card-header router-section-title'>
            {t('dashboard.admin.sections.channels')}
          </Card.Header>
          {dashboard.top_channels.length === 0 ? (
            <div className='admin-dashboard-empty'>{t('dashboard.admin.empty.channels')}</div>
          ) : (
            <Table compact='very' basic='very' celled>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>{t('dashboard.admin.table.channel_name')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('dashboard.admin.table.status')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('dashboard.admin.table.capabilities')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('dashboard.admin.table.balance')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('dashboard.admin.table.used_cost')}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {dashboard.top_channels.map((row) => (
                  <Table.Row key={row.id}>
                    <Table.Cell>{row.name || '-'}</Table.Cell>
                    <Table.Cell>
                      <Label size='tiny' color={statusColor(Number(row.status))}>
                        {t(`dashboard.admin.channel_status.${Number(row.status)}`, {
                          defaultValue: t('dashboard.admin.channel_status.default'),
                        })}
                      </Label>
                    </Table.Cell>
                    <Table.Cell>{renderCapabilities(row.capabilities)}</Table.Cell>
                    <Table.Cell>{Number(row.balance || 0).toFixed(4)}</Table.Cell>
                    <Table.Cell>{formatUsd(Number(row.used_quota || 0))}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card.Content>
      </Card>

      <Card fluid className='chart-card admin-dashboard-section'>
        <Card.Content>
          <Card.Header className='router-card-header router-section-title'>
            {t('dashboard.admin.sections.tasks')}
          </Card.Header>
          {dashboard.recent_tasks.length === 0 ? (
            <div className='admin-dashboard-empty'>{t('dashboard.admin.empty.tasks')}</div>
          ) : (
            <Table compact='very' basic='very' celled>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>{t('dashboard.admin.table.task_type')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('dashboard.admin.table.task_status')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('dashboard.admin.table.task_channel')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('dashboard.admin.table.task_model')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('dashboard.admin.table.task_created')}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {dashboard.recent_tasks.map((task) => (
                  <Table.Row key={task.id}>
                    <Table.Cell>
                      {t(`dashboard.admin.task_type.${TASK_TYPE_KEYS[task.type] || 'default'}`, {
                        defaultValue: task.type || '-',
                      })}
                    </Table.Cell>
                    <Table.Cell>
                      <Label size='tiny' color={taskStatusColor(task.status)}>
                        {t(`dashboard.admin.task_status.${task.status || 'default'}`, {
                          defaultValue: task.status || '-',
                        })}
                      </Label>
                    </Table.Cell>
                    <Table.Cell>{task.channel_name || '-'}</Table.Cell>
                    <Table.Cell>{task.model || '-'}</Table.Cell>
                    <Table.Cell>{task.created_at ? formatUpdatedAt(task.created_at) : '-'}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default AdminDashboard;
