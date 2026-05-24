import i18n from "@/locales/i18n";
import type {
  AccountSnapshot,
  LocalUsageDay,
  LocalUsageSnapshot,
  RateLimitSnapshot,
} from "../../types";
import { formatRelativeTime } from "../../utils/time";
import { getUsageLabels } from "../app/utils/usageLabels";
import {
  buildWindowCaption,
  formatAccountTypeLabel,
  formatCompactNumber,
  formatCount,
  formatCreditsBalance,
  formatDayCount,
  formatDayLabel,
  formatDuration,
  formatDurationCompact,
  formatPlanType,
  isUsageDayActive,
} from "./homeFormatters";
import type { HomeStatCard, UsageMetric } from "./homeTypes";

type HomeUsageViewModel = {
  accountCards: HomeStatCard[];
  accountMeta: string | null;
  updatedLabel: string | null;
  usageCards: HomeStatCard[];
  usageDays: LocalUsageDay[];
  usageInsights: HomeStatCard[];
};

export function buildHomeUsageViewModel({
  accountInfo,
  accountRateLimits,
  localUsageSnapshot,
  usageMetric,
  usageShowRemaining,
}: {
  accountInfo: AccountSnapshot | null;
  accountRateLimits: RateLimitSnapshot | null;
  localUsageSnapshot: LocalUsageSnapshot | null;
  usageMetric: UsageMetric;
  usageShowRemaining: boolean;
}): HomeUsageViewModel {
  const usageTotals = localUsageSnapshot?.totals ?? null;
  const usageDays = localUsageSnapshot?.days ?? [];
  const latestUsageDay = usageDays[usageDays.length - 1] ?? null;
  const last7Days = usageDays.slice(-7);
  const last7Tokens = last7Days.reduce((total, day) => total + day.totalTokens, 0);
  const last7Input = last7Days.reduce((total, day) => total + day.inputTokens, 0);
  const last7Cached = last7Days.reduce(
    (total, day) => total + day.cachedInputTokens,
    0,
  );
  const last7AgentMs = last7Days.reduce(
    (total, day) => total + (day.agentTimeMs ?? 0),
    0,
  );
  const last30AgentMs = usageDays.reduce(
    (total, day) => total + (day.agentTimeMs ?? 0),
    0,
  );
  const averageDailyAgentMs =
    last7Days.length > 0 ? Math.round(last7AgentMs / last7Days.length) : 0;
  const last7AgentRuns = last7Days.reduce(
    (total, day) => total + (day.agentRuns ?? 0),
    0,
  );
  const last30AgentRuns = usageDays.reduce(
    (total, day) => total + (day.agentRuns ?? 0),
    0,
  );
  const averageTokensPerRun =
    last7AgentRuns > 0 ? Math.round(last7Tokens / last7AgentRuns) : null;
  const averageRunDurationMs =
    last7AgentRuns > 0 ? Math.round(last7AgentMs / last7AgentRuns) : null;
  const last7ActiveDays = last7Days.filter(isUsageDayActive).length;
  const last30ActiveDays = usageDays.filter(isUsageDayActive).length;
  const averageActiveDayAgentMs =
    last7ActiveDays > 0 ? Math.round(last7AgentMs / last7ActiveDays) : null;
  const peakAgentDay = usageDays.reduce<
    | { day: string; agentTimeMs: number }
    | null
  >((best, day) => {
    const value = day.agentTimeMs ?? 0;
    if (value <= 0) {
      return best;
    }
    if (!best || value > best.agentTimeMs) {
      return { day: day.day, agentTimeMs: value };
    }
    return best;
  }, null);

  let longestStreak = 0;
  let runningStreak = 0;
  for (const day of usageDays) {
    if (isUsageDayActive(day)) {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  const usageCards: HomeStatCard[] =
    usageMetric === "tokens"
      ? [
          {
            label: i18n.t("today", { ns: "home" }),
            value: formatCompactNumber(latestUsageDay?.totalTokens ?? 0),
            suffix: i18n.t("suffixTokens", { ns: "home" }),
            caption: latestUsageDay
              ? i18n.t("dayLabelTokens", {
                  ns: "home",
                  day: formatDayLabel(latestUsageDay.day),
                  input: formatCount(latestUsageDay.inputTokens),
                  output: formatCount(latestUsageDay.outputTokens),
                })
              : i18n.t("latestAvailableDay", { ns: "home" }),
          },
          {
            label: i18n.t("last7Days", { ns: "home" }),
            value: formatCompactNumber(usageTotals?.last7DaysTokens ?? last7Tokens),
            suffix: i18n.t("suffixTokens", { ns: "home" }),
            caption: i18n.t("avgPerDay", {
              ns: "home",
              avg: formatCompactNumber(usageTotals?.averageDailyTokens),
            }),
          },
          {
            label: i18n.t("last30Days", { ns: "home" }),
            value: formatCompactNumber(usageTotals?.last30DaysTokens ?? last7Tokens),
            suffix: i18n.t("suffixTokens", { ns: "home" }),
            caption: i18n.t("totalCount", {
              ns: "home",
              count: formatCount(usageTotals?.last30DaysTokens ?? last7Tokens),
            }),
          },
          {
            label: i18n.t("cacheHitRate", { ns: "home" }),
            value: usageTotals
              ? `${usageTotals.cacheHitRatePercent.toFixed(1)}%`
              : "--",
            caption: i18n.t("last7Days", { ns: "home" }),
          },
          {
            label: i18n.t("cachedTokens", { ns: "home" }),
            value: formatCompactNumber(last7Cached),
            suffix: i18n.t("suffixSaved", { ns: "home" }),
            caption:
              last7Input > 0
                ? i18n.t("percentOfPromptTokens", {
                    ns: "home",
                    pct: ((last7Cached / last7Input) * 100).toFixed(1),
                  })
                : i18n.t("last7Days", { ns: "home" }),
          },
          {
            label: i18n.t("avgPerRun", { ns: "home" }),
            value:
              averageTokensPerRun === null
                ? "--"
                : formatCompactNumber(averageTokensPerRun),
            suffix: i18n.t("suffixTokens", { ns: "home" }),
            caption:
              last7AgentRuns > 0
                ? i18n.t("runsInLast7Days", {
                    ns: "home",
                    count: formatCount(last7AgentRuns),
                  })
                : i18n.t("noRunsYet", { ns: "home" }),
          },
          {
            label: i18n.t("peakDay", { ns: "home" }),
            value: formatDayLabel(usageTotals?.peakDay),
            caption: i18n.t("tokensCount", {
              ns: "home",
              count: formatCompactNumber(usageTotals?.peakDayTokens),
            }),
          },
        ]
      : [
          {
            label: i18n.t("last7Days", { ns: "home" }),
            value: formatDurationCompact(last7AgentMs),
            suffix: i18n.t("suffixAgentTime", { ns: "home" }),
            caption: i18n.t("avgPerDay", {
              ns: "home",
              avg: formatDurationCompact(averageDailyAgentMs),
            }),
          },
          {
            label: i18n.t("last30Days", { ns: "home" }),
            value: formatDurationCompact(last30AgentMs),
            suffix: i18n.t("suffixAgentTime", { ns: "home" }),
            caption: i18n.t("totalDuration", {
              ns: "home",
              duration: formatDuration(last30AgentMs),
            }),
          },
          {
            label: i18n.t("runs", { ns: "home" }),
            value: formatCount(last7AgentRuns),
            suffix: i18n.t("suffixRuns", { ns: "home" }),
            caption: i18n.t("last30DaysRunsCount", {
              ns: "home",
              count: formatCount(last30AgentRuns),
            }),
          },
          {
            label: i18n.t("avgPerRun", { ns: "home" }),
            value: formatDurationCompact(averageRunDurationMs),
            caption:
              last7AgentRuns > 0
                ? i18n.t("acrossRunsCount", {
                    ns: "home",
                    count: formatCount(last7AgentRuns),
                  })
                : i18n.t("noRunsYet", { ns: "home" }),
          },
          {
            label: i18n.t("avgPerActiveDay", { ns: "home" }),
            value: formatDurationCompact(averageActiveDayAgentMs),
            caption:
              last7ActiveDays > 0
                ? i18n.t("activeDaysInLast7", {
                    ns: "home",
                    count: formatCount(last7ActiveDays),
                  })
                : i18n.t("noActiveDaysYet", { ns: "home" }),
          },
          {
            label: i18n.t("peakDay", { ns: "home" }),
            value: formatDayLabel(peakAgentDay?.day ?? null),
            caption: i18n.t("durationAgentTime", {
              ns: "home",
              duration: formatDurationCompact(peakAgentDay?.agentTimeMs ?? 0),
            }),
          },
        ];

  const usageInsights = [
    {
      label: i18n.t("longestStreak", { ns: "home" }),
      value: longestStreak > 0 ? formatDayCount(longestStreak) : "--",
      caption:
        longestStreak > 0
          ? i18n.t("acrossCurrentUsageRange", { ns: "home" })
          : i18n.t("noActiveStreakYet", { ns: "home" }),
      compact: true,
    },
    {
      label: i18n.t("activeDays", { ns: "home" }),
      value: last7Days.length > 0 ? `${last7ActiveDays} / ${last7Days.length}` : "--",
      caption:
        usageDays.length > 0
          ? i18n.t("activeDaysInRange", {
              ns: "home",
              active: last30ActiveDays,
              total: usageDays.length,
            })
          : i18n.t("noActivityYet", { ns: "home" }),
      compact: true,
    },
  ] satisfies HomeStatCard[];

  const usagePercentLabels = getUsageLabels(accountRateLimits, usageShowRemaining);
  const planLabel = formatPlanType(accountRateLimits?.planType ?? accountInfo?.planType);
  const creditsBalance = formatCreditsBalance(accountRateLimits?.credits?.balance);
  const accountCards: HomeStatCard[] = [];

  if (usagePercentLabels.sessionPercent !== null) {
    accountCards.push({
      label: usageShowRemaining
        ? i18n.t("sessionLeft", { ns: "home" })
        : i18n.t("sessionUsage", { ns: "home" }),
      value: `${usagePercentLabels.sessionPercent}%`,
      caption: buildWindowCaption(
        usagePercentLabels.sessionResetLabel,
        accountRateLimits?.primary?.windowDurationMins,
        i18n.t("currentWindow", { ns: "home" }),
      ),
    });
  }

  if (usagePercentLabels.showWeekly && usagePercentLabels.weeklyPercent !== null) {
    accountCards.push({
      label: usageShowRemaining
        ? i18n.t("weeklyLeft", { ns: "home" })
        : i18n.t("weeklyUsage", { ns: "home" }),
      value: `${usagePercentLabels.weeklyPercent}%`,
      caption: buildWindowCaption(
        usagePercentLabels.weeklyResetLabel,
        accountRateLimits?.secondary?.windowDurationMins,
        i18n.t("longerWindow", { ns: "home" }),
      ),
    });
  }

  if (accountRateLimits?.credits?.hasCredits) {
    accountCards.push(
      accountRateLimits.credits.unlimited
        ? {
            label: i18n.t("credits", { ns: "home" }),
            value: i18n.t("unlimited", { ns: "home" }),
            caption: i18n.t("availableBalance", { ns: "home" }),
          }
        : {
            label: i18n.t("credits", { ns: "home" }),
            value: creditsBalance ?? "--",
            suffix: creditsBalance ? i18n.t("suffixCredits", { ns: "home" }) : null,
            caption: i18n.t("availableBalance", { ns: "home" }),
          },
    );
  }

  if (planLabel) {
    accountCards.push({
      label: i18n.t("plan", { ns: "home" }),
      value: planLabel,
      caption: formatAccountTypeLabel(accountInfo?.type),
    });
  }

  return {
    accountCards,
    accountMeta: accountInfo?.email ?? null,
    updatedLabel: localUsageSnapshot
      ? i18n.t("updatedLabel", {
          ns: "home",
          time: formatRelativeTime(localUsageSnapshot.updatedAt),
        })
      : null,
    usageCards,
    usageDays,
    usageInsights,
  };
}
