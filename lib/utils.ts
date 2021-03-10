import { request, gql } from "graphql-request";
import Ajv from "ajv";
import schema from "../schema.json";
import registry from "../registry.json";

export const getBlocksFromTimestamps = async (timestamps) => {
  if (!timestamps?.length) {
    return [];
  }
  const blocks = [];
  for (const timestamp of timestamps) {
    const json = await request(
      "https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks",
      gql`
        query blocks($timestampFrom: Int!, $timestampTo: Int!) {
          blocks(
            first: 1
            orderBy: timestamp
            orderDirection: asc
            where: { timestamp_gt: $timestampFrom, timestamp_lt: $timestampTo }
          ) {
            id
            number
            timestamp
          }
        }
      `,
      { timestampFrom: timestamp, timestampTo: timestamp + 600 }
    );
    blocks.push(+json.blocks[0].number);
  }

  return blocks;
};

/**
 * gets the amount difference plus the % change in change itself (second order change)
 * @param {*} valueNow
 * @param {*} valueAsOfPeriodOne
 * @param {*} valueAsOfPeriodTwo
 */
export const getTwoPeriodPercentChange = (
  valueNow: number,
  valueAsOfPeriodOne: number,
  valueAsOfPeriodTwo: number
) => {
  // get volume info for both 24 hour periods
  const currentChange = valueNow - valueAsOfPeriodOne;
  const previousChange = valueAsOfPeriodOne - valueAsOfPeriodTwo;

  const adjustedPercentChange =
    ((currentChange - previousChange) / previousChange) * 100;
  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return [currentChange, 0];
  }
  return [currentChange, adjustedPercentChange];
};

export const filterCssFromProps = (props) => {
  const p = Object.fromEntries(
    Object.entries(props).filter(([key]) => key !== "css")
  );
  return p;
};

export const getProjects = async () => {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);

  const projects = [];
  let totalParticipantRevenueNow = 0;
  let totalParticipantRevenueOneWeekAgo = 0;
  let totalParticipantRevenueTwoWeeksAgo = 0;

  for (const project in registry) {
    let data;
    if (registry[project].includes("web3index.org")) {
      const { getProject } = await import(`../pages/api/${project}`);
      data = await getProject();
    } else {
      const res = await fetch(registry[project]);
      data = await res.json();
    }
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

export const getProjectBySlug = async (slug) => {
  let data;
  if (registry[slug].includes("web3index.org")) {
    const { getProject } = await import(`../pages/api/${slug}`);
    data = await getProject();
  } else {
    const res = await fetch(registry[slug]);
    data = await res.json();
  }
  return data;
};
