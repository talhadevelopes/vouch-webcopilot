const fs = require('fs');
const path = require('path');

try {
  const htmlPath = path.join(__dirname, 'index.html');
  const svgPath = path.join(__dirname, 'public', 'favicon.svg');
  
  const svgData = fs.readFileSync(svgPath);
  const base64Svg = svgData.toString('base64');
  const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(
    /<link rel="icon" href="public\/favicon.svg" type="image\/svg\+xml">/i, 
    `<link rel="icon" href="${dataUri}" type="image/svg+xml">`
  );

  fs.writeFileSync(htmlPath, html);
} catch (e) {
  console.error(e);
}