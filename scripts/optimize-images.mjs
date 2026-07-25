import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const publicDir = path.join(process.cwd(), "public");
const outputDir = path.join(publicDir, "optimized");
await mkdir(outputDir, { recursive: true });

const files = (await readdir(publicDir)).filter((file) =>
  /^img\d+\.jpg$/i.test(file),
);

for (const file of files) {
  const inputPath = path.join(publicDir, file);
  const outputPath = path.join(outputDir, file);
  const { size: beforeSize } = await stat(inputPath);

  await sharp(inputPath)
    .rotate()
    .resize({ width: 960, withoutEnlargement: true })
    .jpeg({ quality: 72, mozjpeg: true })
    .toFile(outputPath);

  const { size: afterSize } = await stat(outputPath);

  console.log(
    `${file}: ${Math.round(beforeSize / 1024)}KB -> ${Math.round(afterSize / 1024)}KB`,
  );
}
