/** Vue popup index.html — entry script points at main.ts (no .tsx). */
export const popupIndexHtmlVueTemplate = (): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HexaJS Popup</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.ts"></script>
  </body>
</html>
`;
