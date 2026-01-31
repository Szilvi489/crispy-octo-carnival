const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const imagesRoot = path.join(rootDir, "assets", "images", "projects");
const outputPath = path.join(rootDir, "_data", "imageOfTheDay.yml");

const isImage = (file) => /\.(png|jpe?g|webp)$/i.test(file);

const collectImages = (dir, collected = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectImages(fullPath, collected);
    } else if (entry.isFile() && isImage(entry.name)) {
      const relative = `/${path.relative(rootDir, fullPath).replace(/\\/g, "/")}`;
      collected.push(relative);
    }
  }
  return collected;
};

const images = collectImages(imagesRoot);

if (!images.length) {
  console.error("No images found under assets/images/projects.");
  process.exit(1);
}

const pick = images[Math.floor(Math.random() * images.length)];

const yaml = `url: ${pick}\nalt: Image of the day\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, yaml, "utf8");

console.log(`Picked: ${pick}`);
