import { spawn } from "node:child_process";

export type NpmScriptResult = {
  exitCode: number | null;
  output: string;
};

export function runNpmScript(script: string, args: string[]): Promise<NpmScriptResult> {
  return new Promise((resolve) => {
    const child = spawn("cmd.exe", ["/c", "npm.cmd", "run", script, "--", ...args], {
      cwd: process.cwd(),
      shell: false,
      windowsHide: true
    });

    const chunks: string[] = [];

    child.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk.toString("utf8"));
    });

    child.stderr.on("data", (chunk: Buffer) => {
      chunks.push(chunk.toString("utf8"));
    });

    child.on("error", (error) => {
      chunks.push(error.message);
      resolve({ exitCode: 1, output: chunks.join("") });
    });

    child.on("close", (exitCode) => {
      resolve({ exitCode, output: chunks.join("") });
    });
  });
}
