#!/usr/bin/env node

/**
 * 自动更新项目数据脚本
 * 从 GitHub API 获取最新的 stars、forks、语言、许可证等信息
 * 更新 src/data/projects-data.json
 *
 * 用法: node scripts/update-projects.js [--dry-run]
 * 环境变量: GITHUB_TOKEN (可选，提高 API 速率限制)
 */

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "src", "data", "projects-data.json");
const DRY_RUN = process.argv.includes("--dry-run");
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function fetchGitHubRepo(fullName) {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "marketing-open-hub-updater",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_TOKEN}`;
  }

  const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers });

  if (!res.ok) {
    console.warn(`  ⚠ ${fullName}: HTTP ${res.status}`);
    return null;
  }

  const data = await res.json();
  return {
    stars: data.stargazers_count,
    forks: data.forks_count,
    language: data.language,
    license: data.license?.spdx_id ?? "",
    description: data.description ?? "",
    homepage: data.homepage ?? "",
    lastUpdated: data.pushed_at?.split("T")[0] ?? "",
  };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("🔄 开始更新项目数据...\n");

  if (!fs.existsSync(DATA_FILE)) {
    console.error("❌ 找不到项目数据文件:", DATA_FILE);
    process.exit(1);
  }

  const projects = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  const rateLimitDelay = GITHUB_TOKEN ? 500 : 2000; // 无 token 时更保守
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const fullName = project.fullName;

    if (!fullName || !fullName.includes("/")) {
      console.log(`  ⏭ ${project.id}: 无 fullName，跳过`);
      continue;
    }

    console.log(`  [${i + 1}/${projects.length}] ${fullName}...`);

    const githubData = await fetchGitHubRepo(fullName);

    if (githubData) {
      const oldStars = project.stars;
      const oldForks = project.forks;

      project.stars = githubData.stars;
      project.forks = githubData.forks;
      project.lastUpdated = githubData.lastUpdated;

      // Only update these if they were empty
      if (!project.language) project.language = githubData.language;
      if (!project.license) project.license = githubData.license;
      if (!project.description) project.description = githubData.description;
      if (!project.homepage && githubData.homepage) project.homepage = githubData.homepage;

      const starsDiff = githubData.stars - oldStars;
      const forksDiff = githubData.forks - oldForks;
      const diffStr = [];
      if (starsDiff !== 0) diffStr.push(`⭐ ${starsDiff > 0 ? "+" : ""}${starsDiff}`);
      if (forksDiff !== 0) diffStr.push(`🍴 ${forksDiff > 0 ? "+" : ""}${forksDiff}`);
      console.log(`    ✓ ${diffStr.join(", ") || "无变化"}`);
      updated++;
    } else {
      failed++;
    }

    // Rate limiting
    if (i < projects.length - 1) {
      await sleep(rateLimitDelay);
    }
  }

  console.log(`\n📊 更新完成: ${updated} 成功, ${failed} 失败`);

  if (DRY_RUN) {
    console.log("\n🔍 Dry run 模式，不写入文件");
    console.log("前 3 个项目预览:");
    console.log(JSON.stringify(projects.slice(0, 3), null, 2));
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2), "utf-8");
    console.log(`\n✅ 已写入: ${DATA_FILE}`);
  }
}

main().catch((err) => {
  console.error("❌ 脚本执行失败:", err.message);
  process.exit(1);
});
