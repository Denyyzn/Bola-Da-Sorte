import fs from "node:fs";

try {
  const actual = fs.readFileSync('../cache_name.txt', 'utf8');
  const version = actual.match(/\d+$/)[0];
  await fs.writeFile('../cache_name.txt', `bola-da-sorte-v${version + 1}`, 'utf8');
} catch (err) {
  throw new Error(err);
}