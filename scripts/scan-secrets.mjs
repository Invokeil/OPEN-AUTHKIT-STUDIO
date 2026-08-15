import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".pnpm-store",
]);
const ignoredFiles = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
]);
const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".html",
  ".css",
  ".svg",
  ".yml",
  ".yaml",
  ".toml",
  ".env",
  ".example",
]);
const patterns = [
  { label: "private key block", regex: /-----BEGIN [A-Z ]+ PRIVATE KEY-----/i },
  { label: "artifact token", regex: /art_v2_[A-Za-z0-9_?=&.-]{12,}/ },
  { label: "OpenAI-style secret", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { label: "AWS-style access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  {
    label: "JWT secret assignment",
    regex: /\bJWT_SECRET\s*[:=]\s*["'][^"']{12,}["']/i,
  },
  {
    label: "service-role key assignment",
    regex:
      /\b(?:SERVICE_ROLE_KEY|FIREBASE_PRIVATE_KEY|DATABASE_URL)\s*[:=]\s*["'][^"']{12,}["']/i,
  },
];

function shouldRead(filePath) {
  const relative = path.relative(root, filePath);
  if (
    !relative ||
    ignoredFiles.has(path.basename(filePath)) ||
    relative === path.join("scripts", "scan-secrets.mjs")
  )
    return false;
  if (relative.split(path.sep).some(part => ignoredDirectories.has(part)))
    return false;
  return (
    textExtensions.has(path.extname(filePath).toLowerCase()) ||
    path.basename(filePath).startsWith(".env")
  );
}

function walk(directory) {
  const findings = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) findings.push(...walk(fullPath));
      continue;
    }
    if (!entry.isFile() || !shouldRead(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf8");
    for (const pattern of patterns) {
      if (pattern.regex.test(content))
        findings.push(`${path.relative(root, fullPath)}: ${pattern.label}`);
    }
  }
  return findings;
}

const findings = walk(root);
if (findings.length > 0) {
  console.error("Potential secrets or internal metadata found:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log(
  "Secret scan passed: no known credential or internal-metadata patterns found."
);
