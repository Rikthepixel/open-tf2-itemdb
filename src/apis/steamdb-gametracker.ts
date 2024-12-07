import fs from "fs/promises";
import path from "path";
import { parseVdf } from "../parsers/vdf";

const BASE_URL = "https://raw.githubusercontent.com";
const REPOSITORY = "SteamDatabase/GameTracking-TF2";
const BRANCH = "master";
const LOCALE_FILE = "tf/resource/tf_english.txt";
const LOCALE_PROTO_OBJ_DEFS_FILE = "tf/resource/tf_proto_obj_defs_english.txt";

export type LocaleFile = {
  tokens: Record<string, string>;
  protoObjDefTokens: Record<string, string>;
};

export const localeJsonFile = path.resolve(
  import.meta.dirname ?? __dirname,
  "../assets/locale.json",
);

export async function readLocaleFile() {
  return await fs
    .readFile(localeJsonFile)
    .then<LocaleFile>((content) => JSON.parse(content.toString()));
}

export async function updateLocaleFile(): Promise<void> {
  const baseUrl = new URL(`/${REPOSITORY}/refs/heads/${BRANCH}/`, BASE_URL);
  const localeFileUrl = new URL(baseUrl);
  const localeProtoObjDefsFileUrl = new URL(baseUrl);

  localeFileUrl.pathname += LOCALE_FILE;
  localeProtoObjDefsFileUrl.pathname += LOCALE_PROTO_OBJ_DEFS_FILE;

  type VdfLocaleFile = {
    lang: {
      Language: string;
      Tokens: Record<string, string>;
    };
  };

  const [locale, localeProtoObjDefs] = await Promise.all([
    fetch(localeFileUrl)
      .then((res) => res.text())
      .then<VdfLocaleFile>(parseVdf),
    fetch(localeProtoObjDefsFileUrl)
      .then((res) => res.text())
      .then<VdfLocaleFile>(parseVdf),
  ] as const);

  await fs.writeFile(
    localeJsonFile,
    JSON.stringify({
      tokens: locale.lang.Tokens,
      protoObjDefTokens: localeProtoObjDefs.lang.Tokens,
    } satisfies LocaleFile),
  );
}
