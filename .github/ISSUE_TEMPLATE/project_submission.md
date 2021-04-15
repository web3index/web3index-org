---
name: Project Submission
about: Submit a project to be included in The Web3 Index
title: New Project Submission
labels: ""
assignees: ""
---

## Project Details

### Project Name

i.e. Livepeer

### Symbol

i.e. LPT

### Brand Color

Enter the project's brand color in hex value format

### Category

i.e. "Service Protocol"

### Subcategory

i.e. "Storage"

### Blockchain

i.e. "Ethereum". If it's a custom chain enter "Custom"

### Everest ID

Everest is used to pull information about the project such as the description. It can be found by searching for the project on [everest.link](https://everest.link).

### Description

Optional. If you don't provide a description it will pull from Everest

### Image

Provide a link to an svg version of the logo.

## Revenue/usage Data Source

For providing revenue data, if the project is built on Ethereum or any other blockchain supported by The Graph, we recommend adding the project to the The Web3 Index subgraph, an indexer for aggregating revenue data across web3 protocols. You can find instructions on how to contribute to this subgraph [here](https://github.com/web3index/subgraph).

If the project's blockchain is not supported by The Graph, you will have to provide to provide this data via a publically accessible endpoint with a json response that adheres to the following schema:

```json
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
      "revenue": 843.22 // total revenue as during this day
    }
    //...
  ]
}
```
