const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const logoDirectory = path.join(root, "logos");

// Some source marks intentionally omit a viewBox so their editable canvases
// stay edge-to-edge. Add one only in memory while rasterizing the PNGs.
const sourceViewBoxes = {
  amex: "0 0 750 471",
  aws: "0 0 190 127",
  bcg: "0 0 72.30983 29.47019",
  capgemini: "0 0 159.4487 35.556198",
  nyse: "0 0 100 100",
};

const logoNames = [
  "coupang",
  "nbcu",
  "aws",
  "bgc",
  "bcg",
  "nyse",
  "amex",
  "capgemini",
];

function rasterizableSvg(name, source) {
  if (!sourceViewBoxes[name] || /<svg\b[^>]*\bviewBox=/i.test(source)) {
    return source;
  }

  return source.replace(/<svg\b/i, `<svg viewBox="${sourceViewBoxes[name]}"`);
}

async function renderLogo(name) {
  const sourcePath = path.join(logoDirectory, `${name}.svg`);
  const outputPath = path.join(logoDirectory, `${name}.png`);
  const source = await fs.readFile(sourcePath, "utf8");
  const svg = rasterizableSvg(name, source);

  await sharp(Buffer.from(svg), { density: 300 })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: 1200, height: 420, fit: "inside", withoutEnlargement: false })
    .grayscale()
    .png({ compressionLevel: 9, palette: true })
    .toFile(outputPath);

  console.log(path.relative(root, outputPath));
}

Promise.all(logoNames.map(renderLogo)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
