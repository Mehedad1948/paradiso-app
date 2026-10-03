import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";
import config from "../openapi.config.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const snapshotPath = resolve(root, config.snapshot);
const outputPath = resolve(root, config.output);
const mode = process.argv[2] ?? "generate";

if (!["generate", "check", "refresh", "check-remote"].includes(mode)) {
  throw new Error(`Unknown OpenAPI task: ${mode}`);
}

function validateSchema(schema) {
  if (!schema || typeof schema !== "object" ||
      !/^3\./.test(schema.openapi ?? "") ||
      !schema.paths || typeof schema.paths !== "object") {
    throw new Error("The backend did not return an OpenAPI 3 schema.");
  }
  return schema;
}

async function readSnapshot() {
  return validateSchema(JSON.parse(await readFile(snapshotPath, "utf8")));
}

async function fetchSchema() {
  const source = process.env.OPENAPI_SCHEMA_URL || config.source;
  const response = await fetch(source, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`OpenAPI fetch failed: HTTP ${response.status} (${source})`);
  return validateSchema(await response.json());
}

function canonical(schema) {
  return `${JSON.stringify(schema, null, 2)}\n`;
}

const remote = mode === "refresh" || mode === "check-remote";
const schema = remote ? await fetchSchema() : await readSnapshot();
const generated = astToString(await openapiTS(schema));

if (mode === "check" || mode === "check-remote") {
  if (mode === "check-remote" && canonical(schema) !== canonical(await readSnapshot())) {
    throw new Error("The committed OpenAPI snapshot differs from the backend. Run npm run api:refresh.");
  }
  if (generated !== await readFile(outputPath, "utf8")) {
    throw new Error("Generated backend types are stale. Run npm run api:generate.");
  }
  console.log("OpenAPI contracts are up to date.");
} else {
  if (mode === "refresh") await writeFile(snapshotPath, canonical(schema));
  await writeFile(outputPath, generated);
  console.log(`Generated ${config.output} from ${mode === "refresh" ? config.source : config.snapshot}.`);
}
