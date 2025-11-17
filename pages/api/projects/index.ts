import { NextApiRequest, NextApiResponse } from "next";
import Ajv from "ajv";
import schema from "../../../schema.json";
import registry from "../../../registry.json";
import { getProject, buildFallbackProject } from "./[id]";
import { getTwoPeriodPercentChange } from "../../../lib/utils";
import { Project } from "../../../types";

/**
 * Loads every project plus aggregate metrics, falling back to zeroed usage
 * when subgraph/custom endpoints fail or return invalid data.
 */
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
    if (registry[project].hide) continue; // Skip projects marked hidden.

    let data: Project;
    try {
      data = await getProject(project);
      if (data?.usage?.warning) {
        projects.push(data);
        continue;
      }
    } catch (error) {
      console.warn("Failed to load project data", { project, error });
      projects.push(
        buildFallbackProject(
          project,
          "Could not fetch usage data for this project.",
        ),
      );
      continue;
    }

    if (!validate(data)) {
      console.warn("Project failed schema validation", {
        project,
        errors: validate.errors,
      });
      projects.push(
        buildFallbackProject(
          project,
          "Could not fetch usage data for this project. Incorrect data format received.",
        ),
      );
      continue;
    }

    const hasUsageData =
      Array.isArray(data.usage?.days) &&
      data.usage.days.length > 0 &&
      typeof data.usage?.revenue?.now === "number";
    if (!hasUsageData) {
      projects.push(
        buildFallbackProject(
          project,
          "No usage data available for this project.",
        ),
      );
      continue;
    }

    const [oneWeekTotal, oneWeekPercentChange] = getTwoPeriodPercentChange(
      data.usage.revenue.now,
      data.usage.revenue.oneWeekAgo,
      data.usage.revenue.twoWeeksAgo,
    );

    const [thirtyDayTotal, thirtyDayPercentChange] = getTwoPeriodPercentChange(
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
      totalParticipantRevenueThirtyDaysAgo += data.usage.revenue.thirtyDaysAgo;
      totalParticipantRevenueSixtyDaysAgo += data.usage.revenue.sixtyDaysAgo;
      totalParticipantRevenueNinetyDaysAgo += data.usage.revenue.ninetyDaysAgo;
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
    projects: projects,
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
