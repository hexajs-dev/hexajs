/** Minimal HTML page that acts as devtools_page; loads the bridge entry script. */
export const devtoolsBridgeHtmlTemplate = (): string =>
  `<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <script type="module" src="./devtools.ts"></script>
  </body>
</html>
`;
