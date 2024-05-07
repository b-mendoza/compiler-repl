"use server";
import { spawn } from "node:child_process";

async function getOutput(
  code: string,
  command: string
): Promise<{ stdout: string; stderr: string }> {
  const childProcess = spawn(command, {
    shell: true,
    stdio: ["pipe", "pipe", "pipe"],
  });

  childProcess.stdout.setEncoding("utf-8");
  childProcess.stderr.setEncoding("utf-8");

  const { stdout, stderr } = await new Promise<{
    stdout: string;
    stderr: string;
  }>((resolve) => {
    childProcess.stdin.write(code + "\n", () => {
      let out = "";
      let err = "";
      let outCompleted = false;
      let errCompleted = false;
      function resolveIfDone() {
        if (outCompleted && errCompleted) {
          resolve({ stderr: err, stdout: out });
        }
      }

      childProcess.stdout.on("data", function (data) {
        out += data.toString();
      });
      childProcess.stdout.on("end", function () {
        outCompleted = true;
        resolveIfDone();
      });

      childProcess.stderr.on("data", function (data) {
        err += data.toString();
      });
      childProcess.stderr.on("end", function () {
        errCompleted = true;
        resolveIfDone();
      });
    });
    childProcess.stdin.end();
  });

  return { stdout, stderr };
}

export async function eslint(
  code: string
): Promise<{ stdout: string; stderr: string }> {
  return getOutput(
    code,
    `npx eslint --no-eslintrc --config compiler.eslintrc.json --stdin --no-color`
  );
}

export async function transpile(
  code: string,
  config: string = "compiler.babelrc.json"
): Promise<{ stdout: string; stderr: string }> {
  return getOutput(code, `npx babel --config-file ./${config} -f foo.js`);
}
