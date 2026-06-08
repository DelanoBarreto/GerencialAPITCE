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

/**
 * Versão com streaming de progresso via AsyncGenerator.
 * Emite cada linha de stdout/stderr conforme chega, e no final emite o exitCode.
 */
export async function* runNpmScriptStream(
  script: string,
  args: string[]
): AsyncGenerator<{ type: "line"; text: string } | { type: "done"; exitCode: number | null }> {
  const child = spawn("cmd.exe", ["/c", "npm.cmd", "run", script, "--", ...args], {
    cwd: process.cwd(),
    shell: false,
    windowsHide: true
  });

  // Buffer para lidar com chunks parciais
  let stdoutBuf = "";
  let stderrBuf = "";

  const lines: Array<{ type: "line"; text: string } | { type: "done"; exitCode: number | null }> = [];
  let resolveNext: (() => void) | null = null;
  let done = false;
  let exitCodeResult: number | null = null;

  function push(item: { type: "line"; text: string } | { type: "done"; exitCode: number | null }) {
    lines.push(item);
    resolveNext?.();
  }

  function flushLines(buf: string): string {
    const parts = buf.split("\n");
    for (let i = 0; i < parts.length - 1; i++) {
      const line = parts[i]!.trim();
      if (line) push({ type: "line", text: line });
    }
    return parts[parts.length - 1] ?? "";
  }

  child.stdout.on("data", (chunk: Buffer) => {
    stdoutBuf += chunk.toString("utf8");
    stdoutBuf = flushLines(stdoutBuf);
  });

  child.stderr.on("data", (chunk: Buffer) => {
    stderrBuf += chunk.toString("utf8");
    stderrBuf = flushLines(stderrBuf);
  });

  child.on("error", (err) => {
    push({ type: "line", text: `ERRO: ${err.message}` });
    push({ type: "done", exitCode: 1 });
    done = true;
    resolveNext?.();
  });

  child.on("close", (code) => {
    exitCodeResult = code;
    // Flush buffers restantes
    if (stdoutBuf.trim()) push({ type: "line", text: stdoutBuf.trim() });
    if (stderrBuf.trim()) push({ type: "line", text: stderrBuf.trim() });
    push({ type: "done", exitCode: code });
    done = true;
    resolveNext?.();
  });

  while (true) {
    if (lines.length > 0) {
      const item = lines.shift()!;
      yield item;
      if (item.type === "done") break;
    } else if (done) {
      break;
    } else {
      await new Promise<void>((res) => {
        resolveNext = res;
      });
      resolveNext = null;
    }
  }
}
