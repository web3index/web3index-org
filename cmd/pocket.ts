import prisma from "../lib/prisma";

// POKT Price Feed
const axios = require("axios");
const priceEndpoint = "https://thunderheadotc.com/api/price/";

// Pocket Network Metrics
const { InfluxDB } = require("@influxdata/influxdb-client");
const influxURL = "https://influx.portal.pokt.network:8086";
const influxToken = process.env.POCKET_INFLUX_TOKEN;
const influxOrg = "pocket";
const influxClient = new InfluxDB({
  url: influxURL,
  token: influxToken,
  timeout: 600000,
});
const queryApi = influxClient.getQueryApi(influxOrg);

const coin = {
  name: "pocket network",
  symbol: "POKT",
};

const today = new Date();
today.setUTCHours(0, 0, 0, 0);

// Update Pocket Network daily revenue data
// a cron job should hit this endpoint every hour
const pocketImport = async () => {
  // This will fetch successfuly relays on the network for blockchains with revenue
  // and sum up the fees for the day, on an hourly basis; totalling to the day's revenue.
  const revenueBlockchains = `["0001","0003","0004","0005","000A","0006","0007","0009","000B","0010","0021","0022","0023","0024","0025","0026","0027","000C","0028"]`;

  const fluxQuery = `
      from(bucket: "mainnetRelayApp60m")
        |> range(start: -1h)
        |> filter(fn: (r) =>
          r._measurement == "relay" and
          r._field == "count" and
          (r.method != "synccheck" and r.method != "chaincheck") and
          contains(value: r["blockchain"], set: ${revenueBlockchains}) and
          r.result == "200"
        )
      `;
  let results: any[] = [];
  let successfulRelays = 0;
  let revenue = 0;
  results = (await queryApi.collectRows(fluxQuery)) as any[];
  if (results.length) {
    successfulRelays = results.length;
  }
  console.log(`Successful relays in the last hour: ${successfulRelays}.`);

  const pocketPrice = await getPOKTPrice();
  console.log(`POKT Price: ${pocketPrice}.`);

  if (successfulRelays > 0 && pocketPrice) {
    revenue = successfulRelays * pocketPrice;
    console.log(`Estimated revenue in the last hour: ${revenue} USD.`);
  }

  // const project = await getProject(coin.name);

  // console.log(`${project.name} stored day ${today} - ${today.getTime() / 1000} to DB - value: ${revenue}`);

  // const fee = {
  //     date: today.getTime() / 1000,
  //     fees: revenue,
  // };
  // await storeDBData(fee, project.id);

  // console.log("Finished updating pocket network revenue...");

  return;
};

const getProject = async (name: string) => {
  let project = await prisma.project.findFirst({
    where: {
      name: name,
    },
  });

  if (project == null) {
    console.log(`Project ${name} doesn't exist. Create it`);
    await prisma.project.create({
      data: {
        name: name,
        lastImportedId: "1632268800",
      },
    });

    project = await prisma.project.findUnique({
      where: {
        name: name,
      },
    });
  }

  return project;
};

const storeDBData = async (
  dayData: {
    date: any;
    fees: any;
  },
  projectId: number
) => {
  const day = await prisma.day.findFirst({
    where: {
      date: dayData.date,
      projectId: projectId,
    },
  });

  if (day != null) {
    const accruedRevenue = day.revenue + dayData.fees;

    await prisma.day.update({
      where: {
        id: day.id,
      },
      data: {
        revenue: accruedRevenue,
      },
    });
  } else {
    await prisma.day.create({
      data: {
        date: dayData.date,
        revenue: dayData.fees,
        projectId: projectId,
      },
    });
  }

  // update project's last updated date
  await prisma.project.updateMany({
    where: {
      name: coin.name,
    },
    data: {
      lastImportedId: dayData.date.toString(),
    },
  });

  return;
};

const getPOKTPrice = async () => {
  let price = 0;
  const response = await axios.get(priceEndpoint);
  if (response.data.status === "200") {
    price = parseFloat(response.data.price);
  }
  return price;
};

pocketImport()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
