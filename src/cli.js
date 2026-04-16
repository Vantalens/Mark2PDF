#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderMarkdownToPdf } from "./renderer.js";

function printHelp() {
  const helpText = `
Mark2PDF - 将 Markdown 文件转换为 PDF

用法:
  mark2pdf <input.md> [output.pdf] [--format A4|Letter]

示例:
  mark2pdf ./demo.md
  mark2pdf ./demo.md ./demo.pdf --format Letter
`;

  process.stdout.write(helpText.trim() + "\n");
}

function parseArgs(argv) {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    return { help: true };
  }

  const options = {
    input: null,
    output: null,
    format: "A4",
  };

  const positional = [];
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--format") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("--format 需要一个值（A4 或 Letter）");
      }
      options.format = value;
      i += 1;
      continue;
    }
    positional.push(token);
  }

  if (positional.length < 1) {
    throw new Error("缺少输入文件：请传入一个 .md 文件路径");
  }

  options.input = positional[0];
  options.output = positional[1] ?? null;
  return options;
}

function resolvePaths(inputArg, outputArg) {
  const inputPath = path.resolve(process.cwd(), inputArg);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`输入文件不存在: ${inputPath}`);
  }

  const inputExt = path.extname(inputPath).toLowerCase();
  if (inputExt !== ".md" && inputExt !== ".markdown") {
    throw new Error("输入文件必须是 .md 或 .markdown");
  }

  const defaultOutput = path.join(
    path.dirname(inputPath),
    `${path.basename(inputPath, path.extname(inputPath))}.pdf`
  );

  const outputPath = outputArg
    ? path.resolve(process.cwd(), outputArg)
    : defaultOutput;

  return { inputPath, outputPath };
}

async function main() {
  try {
    const parsed = parseArgs(process.argv);
    if (parsed.help) {
      printHelp();
      return;
    }

    const { inputPath, outputPath } = resolvePaths(parsed.input, parsed.output);
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const cssPath = path.resolve(__dirname, "template.css");

    const format = String(parsed.format || "A4").toUpperCase();
    if (!["A4", "LETTER"].includes(format)) {
      throw new Error("--format 仅支持 A4 或 Letter");
    }

    await renderMarkdownToPdf({
      inputPath,
      outputPath,
      cssPath,
      pdfOptions: {
        format,
      },
    });

    process.stdout.write(`转换完成: ${outputPath}\n`);
  } catch (error) {
    process.stderr.write(`转换失败: ${error.message}\n`);
    process.exitCode = 1;
  }
}

main();
