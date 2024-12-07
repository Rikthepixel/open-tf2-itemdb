import fs from "fs/promises";
import path from "path";

const spreadSheetPath = path.resolve(
  __dirname,
  "../assets/tradetf-spreadsheet.json",
);

type TradeTFUnit = "r" | "b" | "k";
type TradeTFPricing = {
  hi: number;
  low: number;
  mid: number;
  unit: TradeTFUnit;
  unsure: boolean;
};

export type GetTradeTFSpreadSheetResponse = {
  units: {
    k: number;
    r: number;
    b: number;
  };
  items: Record<
    string,
    Record<
      string,
      {
        applied?: TradeTFPricing;
        regular: TradeTFUnit;
      }
    >
  >;
  last_modified: number;
};

// Heavily outdated, but still provides a solid chunk of data.
export async function readTradeTfSpreadsheet() {
  return await fs
    .readFile(spreadSheetPath)
    .then<GetTradeTFSpreadSheetResponse>((file) => JSON.parse(file.toString()));
}
