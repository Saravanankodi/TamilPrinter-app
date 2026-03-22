const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠️  Source not found, skipping: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Next.js standalone needs static files copied manually
copyDir(
  path.join(__dirname, "..", ".next", "static"),
  path.join(__dirname, "..", ".next", "standalone", ".next", "static")
);

// Copy public assets into standalone
copyDir(
  path.join(__dirname, "..", "public"),
  path.join(__dirname, "..", ".next", "standalone", "public")
);

console.log("✅ Static files copied into standalone directory.");
