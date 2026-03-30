import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  BoltIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  StarIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { EmptyState, Spinner } from '../components/ui';
import apiService from '../services/api';

const FIELD_COLORS = ['#1fb981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

const AwardBadgeIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
    <circle cx="12" cy="8" r="4.5" />
    <path d="M9.4 12.1 8 21l4-2.7 4 2.7-1.4-8.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const formatDateInput = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value.toISOString().slice(0, 10);
};

const castNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const inRange = (value, from, to) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= from && date <= to;
};

const formatMonthKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (value) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short'
  });

const buildMonthlySeries = (rows = [], fromDate, toDate) => {
  const sourceMap = new Map(
    toArray(rows)
      .filter((row) => row?.monthKey)
      .map((row) => [
        row.monthKey,
        {
          monthKey: row.monthKey,
          monthLabel: row.monthLabel || formatMonthLabel(`${row.monthKey}-01T00:00:00.000Z`),
          matches: castNumber(row.matches),
          goals: castNumber(row.goals)
        }
      ])
  );

  const start = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDate}T00:00:00.000Z`);
  start.setUTCDate(1);
  end.setUTCDate(1);

  const months = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const monthKey = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`;
    const existing = sourceMap.get(monthKey);
    months.push(
      existing || {
        monthKey,
        monthLabel: cursor.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
        matches: 0,
        goals: 0
      }
    );
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return months.slice(-6);
};

const getPlayerName = (player) => {
  if (!player) return 'Unknown Player';
  const fullName = `${player.firstName || ''} ${player.lastName || ''}`.trim();
  return fullName || player.username || player.email || 'Unknown Player';
};

const buildFallbackAnalytics = ({ bookings = [], matches = [], fromDate, toDate }) => {
  const from = new Date(`${fromDate}T00:00:00.000Z`);
  const to = new Date(`${toDate}T23:59:59.999Z`);

  const filteredBookings = toArray(bookings).filter((booking) => inRange(booking?.startTime || booking?.createdAt, from, to));
  const filteredMatches = toArray(matches).filter((match) => inRange(match?.booking?.startTime || match?.recordedAt || match?.createdAt, from, to));

  const bookingsByStatus = filteredBookings.reduce(
    (acc, booking) => {
      const status = booking?.status;
      if (status && Object.prototype.hasOwnProperty.call(acc, status)) {
        acc[status] += 1;
      }
      return acc;
    },
    { pending: 0, confirmed: 0, cancelled: 0, completed: 0 }
  );

  const totalBookings = filteredBookings.length;
  const totalRevenue = filteredBookings.reduce((sum, booking) => sum + castNumber(booking?.totalPrice), 0);
  const completionRate = totalBookings > 0 ? Number(((bookingsByStatus.completed / totalBookings) * 100).toFixed(2)) : 0;

  const fieldMap = new Map();
  filteredBookings.forEach((booking) => {
    const fieldId = booking?.field?.id || booking?.fieldId;
    if (!fieldId) return;
    const existing = fieldMap.get(fieldId) || {
      fieldId,
      bookingCount: 0,
      revenue: 0,
      field: booking?.field || null
    };
    existing.bookingCount += 1;
    existing.revenue += castNumber(booking?.totalPrice);
    if (!existing.field && booking?.field) existing.field = booking.field;
    fieldMap.set(fieldId, existing);
  });

  const monthlyTrendMap = new Map();
  const teamMap = new Map();
  const mvpMap = new Map();

  filteredMatches.forEach((match) => {
    const dateValue = match?.booking?.startTime || match?.recordedAt || match?.createdAt;
    const monthKey = formatMonthKey(dateValue);
    if (monthKey) {
      const existingTrend = monthlyTrendMap.get(monthKey) || {
        monthKey,
        monthLabel: formatMonthLabel(dateValue),
        matches: 0,
        goals: 0
      };
      existingTrend.matches += 1;
      existingTrend.goals += castNumber(match?.homeScore) + castNumber(match?.awayScore);
      monthlyTrendMap.set(monthKey, existingTrend);
    }

    const pushTeam = (team, goalsFor, goalsAgainst) => {
      if (!team?.id) return;
      const existing = teamMap.get(team.id) || {
        teamId: team.id,
        teamName: team.name || 'Unknown Team',
        teamLogoUrl: team.logoUrl || null,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        played: 0,
        points: 0
      };

      existing.played += 1;
      existing.goalsFor += goalsFor;
      existing.goalsAgainst += goalsAgainst;

      if (goalsFor > goalsAgainst) {
        existing.wins += 1;
        existing.points += 3;
      } else if (goalsFor < goalsAgainst) {
        existing.losses += 1;
      } else {
        existing.draws += 1;
        existing.points += 1;
      }

      teamMap.set(team.id, existing);
    };

    pushTeam(match?.homeTeam, castNumber(match?.homeScore), castNumber(match?.awayScore));
    pushTeam(match?.awayTeam, castNumber(match?.awayScore), castNumber(match?.homeScore));

    if (match?.mvpPlayer?.id) {
      const existingMvp = mvpMap.get(match.mvpPlayer.id) || {
        playerId: match.mvpPlayer.id,
        name: getPlayerName(match.mvpPlayer),
        username: match.mvpPlayer.username || null,
        teamName: match?.homeTeam?.name || match?.awayTeam?.name || null,
        goals: 0,
        metricLabel: 'MVP Awards'
      };
      existingMvp.goals += 1;
      mvpMap.set(match.mvpPlayer.id, existingMvp);
    }
  });

  const monthlyMatchTrends = buildMonthlySeries(
    Array.from(monthlyTrendMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    fromDate,
    toDate
  );
  const fieldPerformance = Array.from(fieldMap.values()).sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 10);
  const teamPerformance = Array.from(teamMap.values())
    .map((team) => ({ ...team, goalDifference: team.goalsFor - team.goalsAgainst }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    })
    .slice(0, 5);
  const topScorers = Array.from(mvpMap.values())
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 5);

  const totalMatches = filteredMatches.length;
  const totalGoals = filteredMatches.reduce((sum, match) => sum + castNumber(match?.homeScore) + castNumber(match?.awayScore), 0);
  const averageGoalsPerMatch = totalMatches > 0 ? Number((totalGoals / totalMatches).toFixed(2)) : 0;
  const activeTeams = teamMap.size;
  const utilizationRate = totalBookings > 0
    ? Number((((bookingsByStatus.confirmed || 0) + (bookingsByStatus.completed || 0)) / totalBookings * 100).toFixed(1))
    : 0;

  return {
    summary: {
      totalBookings,
      totalRevenue,
      completionRate,
      totalMatches,
      totalGoals,
      averageGoalsPerMatch,
      activeTeams,
      utilizationRate,
      bookingGrowthRate: 0
    },
    bookingsByStatus,
    fieldPerformance,
    monthlyMatchTrends,
    teamPerformance,
    topScorers
  };
};

const formatTrend = (value, suffix = '%') => {
  const numeric = castNumber(value);
  return `${numeric >= 0 ? '+' : ''}${numeric}${suffix}`;
};

const formatPercentage = (value) => {
  const numeric = castNumber(value);
  if (Number.isInteger(numeric)) return `${numeric}%`;
  return `${numeric.toFixed(1)}%`;
};

const buildDisplayTeamPerformance = (teams = []) => {
  if (!Array.isArray(teams)) return [];

  const nameCounts = teams.reduce((acc, team) => {
    const name = (team?.teamName || 'Unknown Team').trim();
    acc.set(name, (acc.get(name) || 0) + 1);
    return acc;
  }, new Map());

  return teams.map((team) => {
    const baseName = (team?.teamName || 'Unknown Team').trim();
    const hasDuplicateName = (nameCounts.get(baseName) || 0) > 1;

    return {
      ...team,
      teamName: hasDuplicateName ? `${baseName} #${team.teamId}` : baseName
    };
  });
};

const hasEnoughTeamPerformanceData = (teams = []) =>
  Array.isArray(teams) &&
  teams.some((team) =>
    castNumber(team?.wins) > 0 || castNumber(team?.draws) > 0 || castNumber(team?.losses) > 0
  );

const StatCard = ({ icon: Icon, iconBg, label, value, trend, delay = 0 }) => (
  <div
    className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_10px_26px_rgba(15,23,42,0.10)] animate-fade-in"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="mb-7 flex items-start justify-between gap-4">
      <div className={`flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-gradient-to-br ${iconBg}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
        <ArrowTrendingUpIcon className="h-4 w-4" />
        <span>{trend}</span>
      </div>
    </div>
    <div className="text-[2.2rem] font-extrabold leading-none tracking-tight text-slate-950">{value}</div>
    <p className="mt-3 text-[1.05rem] text-slate-500">{label}</p>
  </div>
);

const InsightCard = ({ icon: Icon, className, value, label, delay = 0 }) => (
  <div
    className={`rounded-[20px] p-6 text-white shadow-[0_12px_30px_rgba(15,23,42,0.14)] animate-fade-in ${className}`}
    style={{ animationDelay: `${delay}s` }}
  >
    <Icon className="mb-6 h-8 w-8" />
    <div className="text-[1.95rem] font-extrabold leading-none">{value}</div>
    <div className="mt-4 max-w-sm text-[0.95rem] leading-7 text-white/95">{label}</div>
  </div>
);

const SectionShell = ({ eyebrow, title, description, action, children, className = '', delay }) => (
  <section
    className={`overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-7 shadow-[0_14px_35px_rgba(15,23,42,0.10)] animate-fade-in ${className}`}
    style={delay ? { animationDelay: delay } : undefined}
  >
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        {eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">{eyebrow}</div> : null}
        <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950 sm:text-[1.6rem]">{title}</h3>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    <div className="mt-6">{children}</div>
  </section>
);

const LineTrendChart = ({ data = [] }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const chartData = data.slice(-6);
  const width = 780;
  const height = 420;
  const padding = { top: 18, right: 22, bottom: 82, left: 74 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(
    1,
    ...chartData.flatMap((item) => [castNumber(item.matches), castNumber(item.goals)])
  );
  const roundedMax = Math.max(20, Math.ceil(maxValue / 55) * 55);
  const yTicks = Array.from({ length: 5 }, (_, index) => Math.round((roundedMax / 4) * index));

  const getPoint = (item, index, key) => {
    const x = padding.left + (chartData.length === 1 ? innerWidth / 2 : (index / (chartData.length - 1)) * innerWidth);
    const value = castNumber(item[key]);
    const y = padding.top + innerHeight - (value / roundedMax) * innerHeight;
    return { x, y, value };
  };

  const pointsForKey = (key) =>
    chartData
      .map((item, index) => {
        const { x, y } = getPoint(item, index, key);
        return `${x},${y}`;
      })
      .join(' ');

  const activeItem = activeIndex !== null ? chartData[activeIndex] : null;
  const activePoint = activeItem ? getPoint(activeItem, activeIndex, 'goals') : null;
  const activeMatchesPoint = activeItem ? getPoint(activeItem, activeIndex, 'matches') : null;
  const activeAnchorY =
    activePoint && activeMatchesPoint ? Math.min(activePoint.y, activeMatchesPoint.y) : null;

  useEffect(() => {
    if (chartData.length === 0) {
      setActiveIndex(null);
      return;
    }

    if (activeIndex !== null && activeIndex >= chartData.length) {
      setActiveIndex(null);
    }
  }, [chartData, activeIndex]);

  return (
    <div className="relative h-full w-full" onMouseLeave={() => setActiveIndex(null)}>
      <div className="h-[300px] w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
          {yTicks.map((tick) => {
            const y = padding.top + innerHeight - (tick / roundedMax) * innerHeight;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#d9e4f2"
                  strokeDasharray="4 6"
                />
                <text x={padding.left - 16} y={y + 5} textAnchor="end" fontSize="12" fill="#64748b">
                  {tick}
                </text>
              </g>
            );
          })}
          {chartData.map((item, index) => {
            const { x } = getPoint(item, index, 'matches');
            return (
              <g key={item.monthKey || index}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + innerHeight}
                  stroke={activeIndex === index ? '#cbd5e1' : '#d9e4f2'}
                  strokeDasharray={activeIndex === index ? undefined : '4 6'}
                  strokeWidth={activeIndex === index ? '1.5' : '1'}
                />
              </g>
            );
          })}
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerHeight} stroke="#94a3b8" strokeWidth="1.5" />
          <line x1={padding.left} y1={padding.top + innerHeight} x2={width - padding.right} y2={padding.top + innerHeight} stroke="#94a3b8" strokeWidth="1.5" />
          <polyline fill="none" stroke="#10b981" strokeWidth="4" points={pointsForKey('matches')} strokeLinecap="round" strokeLinejoin="round" />
          <polyline fill="none" stroke="#3b82f6" strokeWidth="4" points={pointsForKey('goals')} strokeLinecap="round" strokeLinejoin="round" />
          {chartData.map((item, index) => {
            const { x, y: matchY } = getPoint(item, index, 'matches');
            const { y: goalY } = getPoint(item, index, 'goals');
            return (
              <g
                key={item.monthKey || item.monthLabel || index}
                onMouseEnter={() => setActiveIndex(index)}
                className="cursor-pointer"
              >
                <circle
                  cx={x}
                  cy={matchY}
                  r={activeIndex === index ? '5.5' : '5'}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth={activeIndex === index ? '3.5' : '3'}
                />
                <circle
                  cx={x}
                  cy={goalY}
                  r={activeIndex === index ? '5.5' : '5'}
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth={activeIndex === index ? '3.5' : '3'}
                />
                <circle cx={x} cy={matchY} r="12" fill="transparent" />
                <circle cx={x} cy={goalY} r="12" fill="transparent" />
                <text x={x} y={height - 46} textAnchor="middle" fontSize="13" fontWeight="500" fill="#64748b">
                  {item.monthLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {activeItem && activePoint && activeMatchesPoint && activeAnchorY !== null ? (
        <div
          className="absolute rounded-[18px] border border-slate-200 bg-white/98 px-4 py-3 shadow-[0_16px_32px_rgba(15,23,42,0.12)] backdrop-blur-sm"
          style={{
            left: `max(1rem, min(calc(100% - 10.5rem), ${((activePoint.x + 18) / width) * 100}%))`,
            top: `max(1rem, ${((activeAnchorY - 12) / height) * 100}%)`,
            transform: 'translateY(-100%)',
            width: '152px'
          }}
        >
          <div className="text-base font-semibold text-slate-950">{activeItem.monthLabel}</div>
          <div className="mt-3 text-sm font-semibold text-emerald-500">
            {`Matches: ${castNumber(activeItem.matches)}`}
          </div>
          <div className="mt-2 text-sm font-semibold text-blue-500">
            {`Goals: ${castNumber(activeItem.goals)}`}
          </div>
        </div>
      ) : null}
      <div className="mt-5 flex items-center justify-center gap-3 text-[0.9rem] font-medium">
        <div className="flex items-center gap-1 text-emerald-500">
          <span className="relative h-2 w-3.5">
            <span className="absolute left-0 top-1/2 h-[1.5px] w-4 -translate-y-1/2 bg-emerald-500" />
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-500 bg-white" />
          </span>
          Matches
        </div>
        <div className="flex items-center gap-1 text-blue-500">
          <span className="relative h-2 w-3.5">
            <span className="absolute left-0 top-1/2 h-[1.5px] w-4 -translate-y-1/2 bg-blue-500" />
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-500 bg-white" />
          </span>
          Goals
        </div>
      </div>
    </div>
  );
};

const PieUsageChart = ({ data = [] }) => {
  const total = data.reduce((sum, item) => sum + castNumber(item.value), 0);
  const width = 720;
  const height = 420;
  const centerX = 340;
  const centerY = 220;
  const radius = 128;
  const labelRadius = 188;
  const [isVisible, setIsVisible] = useState(false);
  let currentAngle = -Math.PI / 2;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const polarToCartesian = (angle, r = radius) => ({
    x: centerX + Math.cos(angle) * r,
    y: centerY + Math.sin(angle) * r
  });

  const describeSlice = (startAngle, endAngle) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    return [
      `M ${centerX} ${centerY}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
      'Z'
    ].join(' ');
  };

  const shortenFieldName = (value = '') => {
    const normalized = String(value).trim();
    if (!normalized) return 'Unknown Field';

    return normalized
      .replace(/\b(football field|training field|soccer field|field)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || normalized;
  };

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-[720px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
          <g
            className={isVisible ? 'stats-pie-enter' : ''}
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          >
          {data.map((item) => {
            const value = castNumber(item.value);
            const ratio = total > 0 ? value / total : 0;
            const startAngle = currentAngle;
            const endAngle = currentAngle + ratio * Math.PI * 2;

            const slice = (
              <g key={item.name}>
                <path
                  d={describeSlice(startAngle, endAngle)}
                  fill={item.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            );

            currentAngle = endAngle;
            return slice;
          })}
          {total === 0 ? <circle cx={centerX} cy={centerY} r={radius} fill="#e2e8f0" /> : null}
          </g>
          {(() => {
            let labelAngle = -Math.PI / 2;
            return data.map((item) => {
            const value = castNumber(item.value);
            const ratio = total > 0 ? value / total : 0;
            const startAngle = labelAngle;
            const endAngle = labelAngle + ratio * Math.PI * 2;
            const midAngle = startAngle + (endAngle - startAngle) / 2;
            const labelPoint = polarToCartesian(midAngle, labelRadius);
            const textAnchor =
              labelPoint.x > centerX + 12 ? 'start' : labelPoint.x < centerX - 12 ? 'end' : 'middle';
            const label = `${shortenFieldName(item.name)}: ${formatPercentage(item.percentage)}`;

            labelAngle = endAngle;

            return (
              <text
                key={`${item.name}-label`}
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fontSize="16"
                fontWeight="500"
                fill={item.color}
                className={isVisible ? 'stats-pie-label-enter' : ''}
              >
                {label}
              </text>
            );
          });
          })()}
        </svg>
      </div>
    </div>
  );
};

const TeamPerformanceChart = ({ data = [] }) => {
  const [activeTeamIndex, setActiveTeamIndex] = useState(null);
  const maxValue = Math.max(
    1,
    ...data.flatMap((team) => [castNumber(team.wins), castNumber(team.draws), castNumber(team.losses)])
  );
  const roundedMax = Math.max(6, Math.ceil(maxValue / 6) * 6);
  const width = 1180;
  const height = 420;
  const padding = { top: 20, right: 28, bottom: 86, left: 62 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const clusterWidth = innerWidth / Math.max(data.length, 1);
  const totalBarArea = Math.min(126, clusterWidth * 0.62);
  const barGap = Math.max(4, totalBarArea * 0.035);
  const barWidth = Math.max(20, (totalBarArea - barGap * 2) / 3);
  const ticks = Array.from({ length: 5 }, (_, index) => Math.round((roundedMax / 4) * index));
  const activeTeam = activeTeamIndex !== null ? data[activeTeamIndex] : null;
  const clusterVisualWidth = barWidth * 3 + barGap * 2;
  const activeClusterStart =
    activeTeamIndex !== null
      ? padding.left + activeTeamIndex * clusterWidth + (clusterWidth - clusterVisualWidth) / 2
      : null;

  useEffect(() => {
    if (data.length === 0) {
      setActiveTeamIndex(null);
      return;
    }
  }, [data, activeTeamIndex]);

  const handleTeamClick = (teamIndex) => {
    setActiveTeamIndex((current) => (current === teamIndex ? null : teamIndex));
  };

  const truncateTeamName = (value = '') => {
    const name = String(value || '').trim();
    return name.length > 18 ? `${name.slice(0, 16)}...` : name;
  };

  const legendStats = useMemo(
    () => [
      {
        key: 'wins',
        label: 'Wins',
        color: '#10b981',
        tintClass: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
        total: data.reduce((sum, team) => sum + castNumber(team.wins), 0)
      },
      {
        key: 'draws',
        label: 'Draws',
        color: '#94a3b8',
        tintClass: 'border-slate-200 bg-slate-100/90 text-slate-600',
        total: data.reduce((sum, team) => sum + castNumber(team.draws), 0)
      },
      {
        key: 'losses',
        label: 'Losses',
        color: '#ef4444',
        tintClass: 'border-rose-200 bg-rose-50/80 text-rose-600',
        total: data.reduce((sum, team) => sum + castNumber(team.losses), 0)
      }
    ],
    [data]
  );

  return (
    <div className="relative h-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
        {ticks.map((tick) => {
          const y = padding.top + innerHeight - (tick / roundedMax) * innerHeight;
          return (
            <g key={tick}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#d9e6f3" strokeDasharray="5 6" />
              <text x={padding.left - 8} y={y + 6} textAnchor="end" fontSize="13" fill="#64748b">
                {tick}
              </text>
            </g>
          );
        })}
        {data.map((team, teamIndex) => {
          const hoverWidth = clusterWidth * 0.92;
          const hoverX = padding.left + teamIndex * clusterWidth + (clusterWidth - hoverWidth) / 2;
          const centerX = padding.left + teamIndex * clusterWidth + clusterWidth / 2;
          return (
            <g key={`grid-${team.teamId || teamIndex}`}>
              {activeTeamIndex === teamIndex ? (
                <rect
                  x={hoverX}
                  y={padding.top}
                  width={hoverWidth}
                  height={innerHeight}
                  fill="rgba(148,163,184,0.16)"
                  rx="20"
                />
              ) : null}
              <line
                x1={centerX}
                y1={padding.top}
                x2={centerX}
                y2={padding.top + innerHeight}
                stroke="#d9e6f3"
                strokeDasharray="5 6"
              />
            </g>
          );
        })}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerHeight} stroke="#7b93b1" strokeWidth="1.5" />
        <line x1={padding.left} y1={padding.top + innerHeight} x2={width - padding.right} y2={padding.top + innerHeight} stroke="#7b93b1" strokeWidth="1.5" />
        {data.map((team, teamIndex) => {
          const clusterStart = padding.left + teamIndex * clusterWidth + (clusterWidth - clusterVisualWidth) / 2;
          const bars = [
            { key: 'wins', color: '#1fb981', label: 'Wins' },
            { key: 'draws', color: '#94a3b8', label: 'Draws' },
            { key: 'losses', color: '#ef4444', label: 'Losses' }
          ];

          return (
            <g key={team.teamId || team.teamName}>
              {bars.map((bar, barIndex) => {
                const value = castNumber(team[bar.key]);
                if (value <= 0) return null;
                const barHeight = Math.max(8, (value / roundedMax) * innerHeight);
                const x = clusterStart + barIndex * (barWidth + barGap);
                const y = padding.top + innerHeight - barHeight;
                return (
                  <g
                    key={bar.key}
                    onMouseEnter={() => setActiveTeamIndex(teamIndex)}
                    onClick={() => handleTeamClick(teamIndex)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="12"
                      fill={bar.color}
                      opacity={activeTeamIndex === null || activeTeamIndex === teamIndex ? 1 : 0.72}
                    />
                    {activeTeamIndex === teamIndex ? (
                      <text
                        x={x + barWidth / 2}
                        y={y - 8}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="700"
                        fill={bar.color}
                      >
                        {value}
                      </text>
                    ) : null}
                  </g>
                );
              })}
              <text
                x={clusterStart + clusterVisualWidth / 2}
                y={height - 34}
                textAnchor="middle"
                fontSize="13"
                fill="#64748b"
                onMouseEnter={() => setActiveTeamIndex(teamIndex)}
                onClick={() => handleTeamClick(teamIndex)}
                className="cursor-pointer"
              >
                {truncateTeamName(team.teamName)}
              </text>
            </g>
          );
        })}
      </svg>
      {activeTeam && activeClusterStart !== null ? (
        <div
          className="absolute rounded-[18px] border border-slate-200 bg-white/98 px-4 py-4 shadow-[0_16px_35px_rgba(15,23,42,0.10)] backdrop-blur-sm"
          style={{
            left: `max(1rem, min(calc(100% - 12rem), ${((activeClusterStart + 125) / width) * 100}%))`,
            top: '3.5rem',
            width: '170px'
          }}
        >
          <div className="text-[0.95rem] font-semibold text-slate-950">{activeTeam.teamName}</div>
          <div className="mt-3 text-[0.95rem] font-medium text-emerald-500">{`Wins: ${castNumber(activeTeam.wins)}`}</div>
          <div className="mt-2 text-[0.95rem] font-medium text-slate-400">{`Draws: ${castNumber(activeTeam.draws)}`}</div>
          <div className="mt-2 text-[0.95rem] font-medium text-red-500">{`Losses: ${castNumber(activeTeam.losses)}`}</div>
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {legendStats.map((item) => (
          <div
            key={item.key}
            className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 shadow-sm ${item.tintClass}`}
          >
            <span
              className="h-3.5 w-3.5 rounded-[4px]"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[0.98rem] font-semibold">{item.label}</span>
            <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-sm font-bold text-slate-700">
              {item.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatisticsPage = () => {
  const [fromDate] = useState(() => {
    const now = new Date();
    const start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    return formatDateInput(start);
  });
  const [toDate] = useState(() => formatDateInput(new Date()));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.get('/analytics/overview', {
        from: `${fromDate}T00:00:00.000Z`,
        to: `${toDate}T23:59:59.999Z`
      });
      setStats(response.data || null);
    } catch (err) {
      const isRouteMissing = err?.status === 404 && String(err?.message || '').includes('/api/analytics/overview');

      if (isRouteMissing) {
        try {
          const [bookingsResponse, matchesResponse] = await Promise.all([
            apiService.get('/bookings'),
            apiService.get('/match-results')
          ]);

          const fallbackStats = buildFallbackAnalytics({
            bookings: bookingsResponse.data,
            matches: matchesResponse.data,
            fromDate,
            toDate
          });

          setStats(fallbackStats);
          setError('');
          return;
        } catch (fallbackError) {
          setStats(null);
          setError(fallbackError?.message || fallbackError?.error || 'Unable to load statistics right now.');
          return;
        }
      }

      setStats(null);
      setError(err?.message || err?.error || 'Unable to load statistics right now.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const summary = useMemo(() => stats?.summary || {}, [stats?.summary]);
  const fieldPerformance = useMemo(
    () => (Array.isArray(stats?.fieldPerformance) ? stats.fieldPerformance : []),
    [stats?.fieldPerformance]
  );
  const monthlyMatchTrends = useMemo(
    () => buildMonthlySeries(Array.isArray(stats?.monthlyMatchTrends) ? stats.monthlyMatchTrends : [], fromDate, toDate),
    [stats?.monthlyMatchTrends, fromDate, toDate]
  );
  const teamPerformance = useMemo(
    () => (Array.isArray(stats?.teamPerformance) ? stats.teamPerformance : []),
    [stats?.teamPerformance]
  );
  const displayedTeamPerformance = useMemo(
    () => buildDisplayTeamPerformance(teamPerformance.slice(0, 5)),
    [teamPerformance]
  );
  const hasTeamPerformanceChartData = useMemo(
    () => hasEnoughTeamPerformanceData(teamPerformance),
    [teamPerformance]
  );
  const topScorers = useMemo(
    () => (Array.isArray(stats?.topScorers) ? stats.topScorers : []),
    [stats?.topScorers]
  );
  const fieldUsageData = useMemo(() => {
    const rankedFields = fieldPerformance.slice(0, 4);
    const totalBookings = rankedFields.reduce((sum, field) => sum + castNumber(field.bookingCount), 0);
    return rankedFields.map((field, index) => {
      const count = castNumber(field.bookingCount);
      const percentage = totalBookings > 0 ? Number(((count / totalBookings) * 100).toFixed(1)) : 0;
      return {
        name: field.field?.name || `Field ${index + 1}`,
        value: count,
        percentage,
        color: FIELD_COLORS[index % FIELD_COLORS.length]
      };
    });
  }, [fieldPerformance]);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total Matches',
        value: castNumber(summary.totalMatches).toLocaleString(),
        icon: BoltIcon,
        iconBg: 'from-emerald-400 to-teal-500',
        trend: `${castNumber(summary.totalMatches).toLocaleString()} played`
      },
      {
        label: 'Total Goals',
        value: castNumber(summary.totalGoals).toLocaleString(),
        icon: AwardBadgeIcon,
        iconBg: 'from-amber-400 to-orange-500',
        trend: `${castNumber(summary.averageGoalsPerMatch).toFixed(2)} avg`
      },
      {
        label: 'Avg per Match',
        value: castNumber(summary.averageGoalsPerMatch).toFixed(2),
        icon: ChartBarIcon,
        iconBg: 'from-fuchsia-500 to-violet-600',
        trend: `${castNumber(summary.completionRate).toFixed(1)}% completed`
      },
      {
        label: 'Active Teams',
        value: castNumber(summary.activeTeams).toLocaleString(),
        icon: UserGroupIcon,
        iconBg: 'from-amber-400 to-orange-500',
        trend: `${castNumber(summary.utilizationRate).toFixed(1)}% active`
      }
    ],
    [summary]
  );

  const insights = useMemo(
    () => [
      {
        icon: CalendarDaysIcon,
        value: `${castNumber(summary.utilizationRate).toFixed(1)}%`,
        label: 'Average booking utilization rate across all fields',
        className: 'bg-gradient-to-br from-emerald-500 via-emerald-500 to-green-600'
      },
      {
        icon: ArrowTrendingUpIcon,
        value: formatTrend(summary.bookingGrowthRate),
        label: 'Growth in match bookings compared to the previous half of this period',
        className: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700'
      },
      {
        icon: ShieldCheckIcon,
        value: `${castNumber(summary.completionRate).toFixed(1)}%`,
        label: 'Match completion rate without cancellations',
        className: 'bg-gradient-to-br from-fuchsia-500 via-purple-500 to-violet-700'
      }
    ],
    [summary]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="animate-fade-in">
        <div>
          <div>
            <h2 className="text-[2rem] font-extrabold tracking-tight text-slate-950 sm:text-[2.2rem]">Statistics &amp; Analytics</h2>
            <p className="mt-3 text-[1.05rem] text-slate-600">
              Track performance, trends, and insights
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => (
          <StatCard key={card.label} {...card} delay={index * 0.08} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <SectionShell
          title="Monthly Trends"
          className="px-7 py-6"
          delay="0.15s"
        >
          <div className="mt-6 h-[360px]">
            {monthlyMatchTrends.length === 0 ? (
              <EmptyState title="No completed matches yet" description="Completed match results will appear here once scores are recorded." />
            ) : (
              <LineTrendChart data={monthlyMatchTrends} />
            )}
          </div>
        </SectionShell>

        <SectionShell
          title="Field Usage Distribution"
          className="px-7 py-6"
          delay="0.22s"
        >
          <div className="mt-6 min-h-[360px]">
            {fieldUsageData.length === 0 ? (
              <EmptyState title="No field usage yet" description="Bookings are needed before distribution can be shown." />
            ) : (
              <PieUsageChart data={fieldUsageData} />
            )}
          </div>
        </SectionShell>
      </section>

      <SectionShell
        title="Top 5 Team Performance"
        className="rounded-[26px] px-8 py-8 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
        delay="0.3s"
      >
        <div className="mt-5 min-h-[520px]">
          {!hasTeamPerformanceChartData ? (
            <EmptyState
              title="No real team performance data yet"
              description="This chart will populate automatically once completed match results are recorded."
            />
          ) : (
            <TeamPerformanceChart data={displayedTeamPerformance} />
          )}
        </div>
        {!hasTeamPerformanceChartData ? (
          <p className="mt-3 text-sm text-slate-500">
            Current real-data summary: {displayedTeamPerformance.length} ranked team record{displayedTeamPerformance.length === 1 ? '' : 's'} found in this date range.
          </p>
        ) : null}
      </SectionShell>

      <section
        className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.10)] animate-fade-in"
        style={{ animationDelay: '0.38s' }}
      >
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-6 py-5">
          <h3 className="flex items-center gap-3 text-lg font-bold tracking-tight text-white sm:text-[1.45rem]">
            <TrophyIcon className="h-5 w-5" />
            Top Scorers
          </h3>
          <p className="mt-1 text-sm text-orange-50">
            Ranked from live recorded match result data.
          </p>
        </div>
        <div className="space-y-4 p-6">
          {topScorers.length === 0 ? (
            <EmptyState title="No MVP data yet" description="Choose MVP players on completed matches to populate this leaderboard." />
          ) : (
            topScorers.map((player, index) => (
              <div
                key={player.playerId || `${player.name}-${index}`}
                className="flex items-center gap-4 rounded-[20px] bg-slate-50 px-5 py-4 transition hover:bg-slate-100"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[2rem] font-bold ${
                    index === 0
                      ? 'bg-amber-500 text-white'
                      : index === 1
                        ? 'bg-slate-400 text-white'
                        : index === 2
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[1rem] font-bold text-slate-950">{player.name || 'Unknown Player'}</div>
                  <div className="mt-1 truncate text-sm text-slate-500">{player.teamName || player.username || 'Team not available'}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-start justify-end gap-2">
                    <div className="text-[2.55rem] font-extrabold leading-none text-emerald-600">{castNumber(player.goals)}</div>
                    <StarIcon className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {player.metricLabel || 'Goals'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {insights.map((insight, index) => (
          <InsightCard key={insight.label} {...insight} delay={0.45 + index * 0.08} />
        ))}
      </section>
    </div>
  );
};

export default StatisticsPage;
