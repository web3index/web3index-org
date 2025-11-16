export type Name = string;
export type Category = string;
export type Subcategory = string;
export type Blockchain = string;
export type Stack = string;
export type Sym = string;
export type EverestID = string;
export type Image = string;
export type Color = string;
export type CoingeckoID = string;
export type Now = number;
export type OneDayAgo = number;
export type TwoDaysAgo = number;
export type OneWeekAgo = number;
export type TwoWeeksAgo = number;
export type ThirtyDaysAgo = number;
export type SixtyDaysAgo = number;
export type NinetyDaysAgo = number;
export type Date = number;
export type Days = Items[];

export interface Project {
  name: Name;
  category: Category;
  subcategory: Subcategory;
  blockchain: Blockchain;
  stack: Stack;
  symbol: Sym;
  everestID: EverestID;
  image: Image;
  color: Color;
  coingeckoID?: CoingeckoID;
  usage: Usage;
  untracked: boolean;
  [k: string]: unknown;
}
export interface Usage {
  revenue: Revenue;
  dilution: Revenue;
  days: Days;
  [k: string]: unknown;
  warning?: string;
}
export interface Revenue {
  now: Now;
  oneDayAgo: OneDayAgo;
  twoDaysAgo: TwoDaysAgo;
  oneWeekAgo: OneWeekAgo;
  twoWeeksAgo: TwoWeeksAgo;
  thirtyDaysAgo?: ThirtyDaysAgo;
  sixtyDaysAgo?: SixtyDaysAgo;
  ninetyDaysAgo?: NinetyDaysAgo;
  [k: string]: unknown;
}
export interface Items {
  date: Date;
  revenue: Revenue;
  dilution: Revenue;
  [k: string]: unknown;
}
