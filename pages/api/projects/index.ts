import { NextApiRequest, NextApiResponse } from "next";
import Ajv from "ajv";
import schema from "../../../schema.json";
import registry from "../../../registry.json";
import { getProject, getEmptyUsageResponse } from "./[id]";
import { getTwoPeriodPercentChange } from "../../../lib/utils";
import { Project } from "../../../types";

const buildFallbackProject = (project: string, warning: string): Project => {
  const base = registry[project] ?? {};
  return {
    ...base,
    untracked: Boolean(base.untracked),
    usage: getEmptyUsageResponse(project, warning),
  } as Project;
};

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

  for (const project in registry) {
    let data: Project;
    try {
      data = await getProject(project);
    } catch (error) {
      console.warn("Failed to load project data; using empty usage response", {
        project,
        error,
      });
      data = buildFallbackProject(
        project,
        "Could not fetch usage data for this project.",
      );
    }

    if (!validate(data)) {
      console.warn("Project failed schema validation; using empty usage data", {
        project,
        errors: validate.errors,
      });
      const fallbackProject = buildFallbackProject(
        project,
        "Could not fetch usage data for this project. Incorrect data format received.",
      );
      if (!validate(fallbackProject)) {
        console.warn("Fallback project data failed validation", {
          project,
          errors: validate.errors,
        });
        continue;
      }
      data = fallbackProject;
    }

    if (!registry[project].hide) {
      const [oneWeekTotal, oneWeekPercentChange] = getTwoPeriodPercentChange(
        data.usage.revenue.now,
        data.usage.revenue.oneWeekAgo,
        data.usage.revenue.twoWeeksAgo,
      );

      const [thirtyDayTotal, thirtyDayPercentChange] =
        getTwoPeriodPercentChange(
          data.usage.revenue.now,
          data.usage.revenue.thirtyDaysAgo,
          data.usage.revenue.sixtyDaysAgo,
        );

      const [oneWeekDilutionTotal, oneWeekDilutionPercentChange] =
        getTwoPeriodPercentChange(
          data.usage?.dilution?.now,
          data.usage?.dilution?.oneWeekAgo,
          data.usage?.dilution?.twoWeeksAgo,
        );

      const [thirtyDayDilutionTotal, thirtyDayDilutionPercentChange] =
        getTwoPeriodPercentChange(
          data.usage?.dilution?.now,
          data.usage?.dilution?.thirtyDaysAgo,
          data.usage?.dilution?.sixtyDaysAgo,
        );

      const isUntracked = Boolean(data.untracked);
      const projectData = {
        ...data,
        untracked: isUntracked,
        slug: project,
        usage: {
          ...data.usage,
          dilution: {
            ...data.usage.dilution,
            oneWeekTotal: oneWeekDilutionTotal,
            oneWeekPercentChange: oneWeekDilutionPercentChange,
            thirtyDayTotal: isUntracked ? 0 : thirtyDayDilutionTotal,
            thirtyDayPercentChange: thirtyDayDilutionPercentChange,
            ninetyDayTotal: isUntracked
              ? 0
              : data.usage.dilution?.now - data.usage.dilution?.ninetyDaysAgo,
          },
          revenue: {
            ...data.usage.revenue,
            oneWeekTotal,
            oneWeekPercentChange,
            thirtyDayTotal: isUntracked ? 0 : thirtyDayTotal,
            thirtyDayPercentChange,
            ninetyDayTotal: isUntracked
              ? 0
              : data.usage.revenue.now - data.usage.revenue.ninetyDaysAgo,
          },
        },
      };
      projects.push(projectData);
      if (!projectData.untracked) {
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
    totalParticipantRevenueTwoWeeksAgo,
  );

  const [thirtyDayTotal, thirtyDayPercentChange] = getTwoPeriodPercentChange(
    totalParticipantRevenueNow,
    totalParticipantRevenueThirtyDaysAgo,
    totalParticipantRevenueSixtyDaysAgo,
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
  };
};

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  const project = await getProjects();
  res.json(project);
};

export default handler;
