import { cpSync, existsSync, mkdirSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

const cesiumSource = join(projectRoot, "node_modules/cesium/Build/Cesium");
const cesiumDest = join(projectRoot, "public/cesium");

if (!existsSync(cesiumSource)) {
  console.error("Cesium source not found:", cesiumSource);
  process.exit(1);
}

// Clean destination if exists
if (existsSync(cesiumDest)) {
  rmSync(cesiumDest, { recursive: true });
}

// Create destination directory
mkdirSync(cesiumDest, { recursive: true });

// Copy assets
cpSync(cesiumSource, cesiumDest, { recursive: true });

console.log("Cesium assets copied to public/cesium");
