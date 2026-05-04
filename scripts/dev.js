import { spawn } from "node:child_process";

const commands = [
  ["npm", ["run", "dev:api"]],
  ["npm", ["run", "dev:web"]]
];

const processes = commands.map(([command, args]) =>
  spawn(command, args, {
    stdio: "inherit",
    shell: true
  })
);

function stopAll(signal) {
  for (const child of processes) {
    child.kill(signal);
  }
}

process.on("SIGINT", () => {
  stopAll("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAll("SIGTERM");
  process.exit(0);
});
