import { NextApiRequest, NextApiResponse } from "next";
import Ajv from "ajv";
import schema from "../../../schema.json";
import registry from "../../../registry.json";
import { getProject } from "./[id]";
import { getTwoPeriodPercentChange } from "../../../lib/utils";
import { Project } from "../../../types";

export const getProjects = async () => {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const projects = [];

  let totalParticipantRevenueNow = 0;
  let totalParticipantRevenueOneWeekAgo = 0;
  let totalParticipantRevenueTwoWeeksAgo = 0;
  let totalParticipantRevenueThirtyDaysAgo = 0;
  let totalParticipantRevenueSixtyDaysAgo = 0;
  let totalParticipantRevenueNinetyDaysAgo = 0;

  const days = [];
  for (const project in registry) {
    const data: Project = await getProject(project);
    const valid = validate(data);

    if (
      registry[project].name !== "Pocket" &&
      registry[project].name !== "Filecoin"
    ) {
      data.usage.days.map((day) => {
        if (days.some((d) => d.date === day.date)) {
          const index = days.findIndex((x) => x.date === day.date);
          days[index].revenue = days[index].revenue + day.revenue;
        } else {
          days.push(day);
        }
      });
    }

    if (valid && !registry[project].hide) {
      const [oneWeekTotal, oneWeekPercentChange] = getTwoPeriodPercentChange(
        data.usage.revenue.now,
        data.usage.revenue.oneWeekAgo,
        data.usage.revenue.twoWeeksAgo
      );

      const [thirtyDayTotal, thirtyDayPercentChange] =
        getTwoPeriodPercentChange(
          data.usage.revenue.now,
          data.usage.revenue.thirtyDaysAgo,
          data.usage.revenue.sixtyDaysAgo
        );

      const [oneWeekDilutionTotal, oneWeekDilutionPercentChange] =
        getTwoPeriodPercentChange(
          data.usage.dilution.now,
          data.usage.dilution.oneWeekAgo,
          data.usage.dilution.twoWeeksAgo
        );

      const [thirtyDayDilutionTotal, thirtyDayDilutionPercentChange] =
        getTwoPeriodPercentChange(
          data.usage.dilution.now,
          data.usage.dilution.thirtyDaysAgo,
          data.usage.dilution.sixtyDaysAgo
        );

      projects.push({
        ...data,
        slug: project,
        usage: {
          ...data.usage,
          dilution: {
            ...data.usage.dilution,
            oneWeekTotal: oneWeekDilutionTotal,
            oneWeekPercentChange: oneWeekDilutionPercentChange,
            thirtyDayTotal: registry[project].untracked
              ? 0
              : thirtyDayDilutionTotal,
            thirtyDayPercentChange: thirtyDayDilutionPercentChange,
            ninetyDayTotal: registry[project].untracked
              ? 0
              : data.usage.dilution.now - data.usage.dilution.ninetyDaysAgo,
          },
          revenue: {
            ...data.usage.revenue,
            oneWeekTotal,
            oneWeekPercentChange,
            thirtyDayTotal: registry[project].untracked ? 0 : thirtyDayTotal,
            thirtyDayPercentChange,
            ninetyDayTotal: registry[project].untracked
              ? 0
              : data.usage.revenue.now - data.usage.revenue.ninetyDaysAgo,
          },
        },
      });
      if (!registry[project].untracked) {
        totalParticipantRevenueNow += data.usage.revenue.now;
        totalParticipantRevenueOneWeekAgo += data.usage.revenue.oneWeekAgo;
        totalParticipantRevenueTwoWeeksAgo += data.usage.revenue.twoWeeksAgo;
        totalParticipantRevenueThirtyDaysAgo +=
          data.usage.revenue.thirtyDaysAgo;
        totalParticipantRevenueSixtyDaysAgo += data.usage.revenue.sixtyDaysAgo;
        totalParticipantRevenueNinetyDaysAgo +=
          data.usage.revenue.ninetyDaysAgo;
      }
    }
  }

  const [oneWeekTotal, oneWeekPercentChange] = getTwoPeriodPercentChange(
    totalParticipantRevenueNow,
    totalParticipantRevenueOneWeekAgo,
    totalParticipantRevenueTwoWeeksAgo
  );

  const [thirtyDayTotal, thirtyDayPercentChange] = getTwoPeriodPercentChange(
    totalParticipantRevenueNow,
    totalParticipantRevenueThirtyDaysAgo,
    totalParticipantRevenueSixtyDaysAgo
  );

  return {
    projects,
    revenue: {
      totalParticipantRevenueNow,
      totalParticipantRevenueOneWeekAgo,
      totalParticipantRevenueTwoWeeksAgo,
      totalParticipantRevenueNinetyDaysAgo,
      oneWeekTotal,
      oneWeekPercentChange,
      thirtyDayTotal,
      thirtyDayPercentChange,
    },
    days: days.sort((a, b) => (a.date > b.date ? 1 : -1)),
  };
};

export default async (_req: NextApiRequest, res: NextApiResponse) => {
  const project = await getProjects();
  res.json(project);
};
