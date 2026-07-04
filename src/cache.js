import fs from "node:fs";

let CACHE_NAME;

try {
  CACHE_NAME = fs.readFileSync('../cache_name.txt', 'utf8');
} catch (err) {
  throw new Error(err);
}

export default CACHE_NAME;
