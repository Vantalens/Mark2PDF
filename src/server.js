import { startWebServer } from "./web-server.js";

const port = Number(process.env.PORT || 3000);

startWebServer(port)
  .then(({ port: actualPort }) => {
    process.stdout.write(`Trans2Former web server running at http://localhost:${actualPort}\n`);
  })
  .catch((error) => {
    process.stderr.write(`Failed to start web server: ${error.message}\n`);
    process.exit(1);
  });
