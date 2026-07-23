import { spawnSync } from "child_process";
import * as path from "path";

const PGDATA = path.join(__dirname, "..", ".pgdata");
const PORT = "5544";

const ready = spawnSync("pg_isready", ["-h", "127.0.0.1", "-p", PORT], { stdio: "ignore" });
if (ready.status === 0) {
  console.log(`Postgres already running on port ${PORT}`);
  process.exit(0);
}

console.log(`Postgres not running — starting local cluster on port ${PORT}...`);
// Homebrew's postgres fails with "postmaster became multithreaded during startup"
// unless a locale is set explicitly before the first NSLocale call on macOS.
const result = spawnSync(
  "pg_ctl",
  ["-D", PGDATA, "-l", path.join(PGDATA, "server.log"), "-o", `-p ${PORT}`, "start"],
  { stdio: "inherit", env: { ...process.env, LC_ALL: "C" } }
);

if (result.status !== 0) {
  console.error("Failed to start Postgres. Check .pgdata/server.log for details.");
  process.exit(result.status ?? 1);
}
