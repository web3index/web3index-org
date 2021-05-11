import { NextApiRequest, NextApiResponse } from "next";
import Ajv from "ajv";
import schema from "../../../schema.json";
import registry from "../../../registry.json";
import { getProject } from "./[id]";
import { getTwoPeriodPercentChange } from "../../../lib/utils";

export const getProjects = async () => {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const projects = [];

  let totalParticipantRevenueNow = 0;
  let totalParticipantRevenueOneWeekAgo = 0;
  let totalParticipantRevenueTwoWeeksAgo = 0;

  for (const project in registry) {
    const data = await getProject(project);
    const valid = validate(data);

    if (valid) {
      const [oneWeekTotal, oneWeekPercentChange] = getTwoPeriodPercentChange(
        data.usage.revenue.now,
        data.usage.revenue.oneWeekAgo,
        data.usage.revenue.twoWeeksAgo
      );

      projects.push({
        ...data,
        slug: project,
        usage: {
          ...data.usage,
          revenue: {
            ...data.usage.revenue,
            oneWeekTotal,
            oneWeekPercentChange,
          },
        },
      });
      totalParticipantRevenueNow += data.usage.revenue.now;
      totalParticipantRevenueOneWeekAgo += data.usage.revenue.oneWeekAgo;
      totalParticipantRevenueTwoWeeksAgo += data.usage.revenue.twoWeeksAgo;
    }
  }

  const [oneWeekTotal, oneWeekPercentChange] = getTwoPeriodPercentChange(
    totalParticipantRevenueNow,
    totalParticipantRevenueOneWeekAgo,
    totalParticipantRevenueTwoWeeksAgo
  );

  return {
    projects,
    revenue: {
      totalParticipantRevenueNow,
      totalParticipantRevenueOneWeekAgo,
      totalParticipantRevenueTwoWeeksAgo,
      oneWeekTotal,
      oneWeekPercentChange,
    },
  };
};

export default async (_req: NextApiRequest, res: NextApiResponse) => {
  const project = await getProjects();
  res.json(project);
};
