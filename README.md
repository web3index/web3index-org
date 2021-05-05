# The Web3 Index

The Web3 Index reports on the fees being paid Web3 networks in an effort to showcase real usage across the Web3 stack. Stay up to date on the latest Web3 trends whether you’re a supply-side participant keeping tabs on in-demand networks, a developer interested in building on top of the most promising Web3 infrastructure, or simply a crypto-enthusiast passionate about the Web3 movement.

Unlike most indexes in defi (a sector of web3) that use market capitalization or ["total locked value (TLV)"](https://messari.io/article/how-to-interpret-total-value-locked-tvl-in-defi), The Web3 Index uses a [fundamental index methodology](https://en.wikipedia.org/wiki/Fundamentally_based_indexes). A key belief behind the fundamental index methodology is that underlying valuation figures (i.e. network revenue and usage) are more accurate estimators of a network's intrinsic value, rather than the listed market value of the project. In the spirit of this methodology, you won't see any token prices on The Web3 Index.

## Providing Revenue Data For Project Submission

In order for a project to be considered for the index, its revenue data must be surfaced in a format that's consumable by the application. If the project you'd like to add to the index is built on Ethereum or any other blockchain supported by The Graph, we recommend adding it to The Web3 Index subgraph. You can find the subgraph [here](https://github.com/web3index/subgraph) and instructions on how to add a protocol to the subgraph [here](https://thegraph.com/docs/introduction).

Once you've successfully added a protocol to the subgraph, make sure to add the project to the [registry file](./registry.json) using its subgraph protocol entity id as the key.

If a project's blockchain is _not_ supported by The Graph, you'll have to provide this data via a publically accessible endpoint with a json response that returns data in the following format, updated at least once a day:

```
{
  "revenue": {
    "now": 61779.07, // total revenue as of now
    "oneDayAgo": 60579.17, // total revenue as of 1 day ago
    "twoDaysAgo": 60390.5, // total revenue as of two days ago
    "oneWeekAgo": 58620.2, // total revenue as of one week ago
    "twoWeeksAgo": 53635.26 // total revenue as of two weeks ago
  },
  "days": [
    {
      "date": 1578960000, // timestamp representing start of day at 12:00 am UTC
      "revenue": 843.22 // total revenue accrued during this day
    }
    // provide as many days available, up to 1,000 until pagination is supported.
  ]
}
```

Finally, add a `usage` property to the registry that points to your endpoint.

## Submiting a Project

1. Go to the "Issues" tab above
2. Click "New Issue"
3. Select "Project Submission"
4. Fill in the template
5. Submit

## Running App Locally

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
