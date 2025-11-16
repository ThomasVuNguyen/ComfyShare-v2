#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")

const firebaseJsonPath = path.join(repoRoot, "firebase.json")
const firebasercPath = path.join(repoRoot, ".firebaserc")

const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, "utf8"))
const firebaserc = JSON.parse(readFileSync(firebasercPath, "utf8"))
const envMap = firebaseJson.projectEnvironments || {}
const aliasMap = firebaserc.projects || {}

const args = process.argv.slice(2)
let projectArg = process.env.FIREBASE_PROJECT || process.env.GCLOUD_PROJECT || process.env.PROJECT_ID || null
let outputFile = path.resolve(process.cwd(), ".env.local")

for (const arg of args) {
  if (arg.startsWith("--project=")) {
    projectArg = arg.replace("--project=", "")
  } else if (arg.startsWith("--out=")) {
    outputFile = path.resolve(process.cwd(), arg.replace("--out=", ""))
  }
}

if (!projectArg) {
  projectArg = aliasMap.default
}

const resolvedProject = aliasMap[projectArg] || projectArg
const envForProject = envMap[resolvedProject]

if (!envForProject) {
  console.error(
    `No projectEnvironments entry found for "${resolvedProject}". Add one under projectEnvironments in firebase.json.`,
  )
  process.exit(1)
}

const lines = Object.entries(envForProject).map(([key, value]) => `${key}=${value ?? ""}`)
writeFileSync(outputFile, lines.join("\n"))
console.log(`Wrote ${lines.length} env vars to ${outputFile} for project ${resolvedProject}`)
