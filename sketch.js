let table;
let mappamondo;
let vulcani = [];
let latMin = 90, latMax = -90, lonMin = 180, lonMax = -180;
let elevMin = Infinity, elevMax = -Infinity;

function preload() {
  table = loadTable('assets/data.csv', 'csv', 'header');
  mappamondo = loadImage('assets/mappa.svg')
}

function setup() {
  createCanvas(1000, 600);
  textFont('Helvetica');
  pigliaIValori();
  // espandi un poco i limiti per margine visivo
  let lonPad = (lonMax - lonMin) * 0.05;
  let latPad = (latMax - latMin) * 0.05;
  lonMin -= lonPad; lonMax += lonPad;
  latMin -= latPad; latMax += latPad;
}

function draw() {
  background(18); // quasi nero
  image(mappamondo, 70, 60, width-100, height-110);
  drawGrid();
  drawVulcani();
  drawLegend();
  drawHover();
}

function pigliaIValori() {
  for (let r = 0; r < table.getRowCount(); r++) {
    let row = table.getRow(r);
    // cambia i nomi delle colonne se sono diversi nel tuo CSV
    let name = row.getString('Volcano Name') || row.getString('Volcano Name'.trim()) || row.getString('Volcano Name'.replace(/\s+/g, ' '));
    // tentativo robusto per colonne: cerca 'Latitude' e 'Longitude'
    let lat = parseFloat(row.getString('Latitude'));
    let lon = parseFloat(row.getString('Longitude'));
    let elev = parseFloat(row.getString('Elevation'));

    // aggiorna range
    latMin = min(latMin, lat);
    latMax = max(latMax, lat);
    lonMin = min(lonMin, lon);
    lonMax = max(lonMax, lon);
    if (!isNaN(elev)) {
      elevMin = min(elevMin, elev);
      elevMax = max(elevMax, elev);
    } else {
      // se manca l'elevazione, metti 0
      elev = 0;
      elevMin = min(elevMin, elev);
      elevMax = max(elevMax, elev);
    }

    vulcani.push({
      name: name,
      lat: lat,
      lon: lon,
      elev: elev
    });
  }

  // fallback se non ci sono elevazioni valide
  if (elevMin === Infinity) { elevMin = 0; elevMax = 3000; }
}

function project(lon, lat) {
  // Equirectangular simple mapping:
  // longitude -> x (left = lonMin, right = lonMax)
  // latitude  -> y (top = latMax, bottom = latMin) (inverto lat per orientamento cartografico)
  let x = map(lon, lonMin, lonMax, 60, width - 60);
  let y = map(lat, latMax, latMin, 60, height - 60);
  return createVector(x, y);
}

function drawGrid() {
  noFill();
  stroke(40);
  strokeWeight(1);
  // bordo
  rect(50, 50, width - 100, height - 110);
  // titolo
  noStroke();
  fill(220);
  textSize(16);
  textAlign(LEFT, TOP);
  text('Mappa vulcani - posizione e elevazione', 60, 20);
}

function drawVulcani() {
  for (let v of vulcani) {
    let pos = project(v.lon, v.lat);
    // scala altezza del triangolo in base all'elevazione
    // altezza minima 8 px, massima 120 px
    let h = v.elev/150

    // colore: palette nero-arancione
    // usiamo un gradiente semplificato basato sull'elevazione
    let t = map(v.elev, elevMin, elevMax, 0, 1, true);
    // oscillazione per più variazione
    let colorLow = color(62, 45, 156); // scuro
    let colorHigh = color(255, 130, 0); // arancio brillante
    let fillCol = lerpColor(colorLow, colorHigh, t);

    push();
    translate(pos.x, pos.y);
    noStroke();

    // triangolo (glifo)
    fill(fillCol);
    stroke(20);
    strokeWeight(1);
    beginShape();
    triangle(
      -h*0.18, 0,
      0, -h,
      h*0.18, 0);
    endShape(CLOSE);
    pop();

    // salva posizione per hit-test
    v.screen = {x: pos.x, y: pos.y, h: h};
  }
}

function drawLegend() {
  let lx = width - 260;
  let ly = height - 120;
  let w = 220;
  let h = 90;

  // pannello
  noStroke();
  fill(30, 180);
  rect(lx, ly, w, h, 8);

  // titolo
  fill(220);
  textSize(12);
  textAlign(LEFT, TOP);
  text('Legenda', lx + 12, ly + 8);

  // colori già usati nel grafico
  let colorLow = color(62, 45, 156);
  let colorHigh = color(255, 130, 0);

  // barra della sfumatura
  let barX = lx + 20;
  let barY = ly + 35;
  let barW = w - 40;
  let barH = 12;

  for (let i = 0; i < barW; i++) {
    let t = map(i, 0, barW, 0, 1);
    stroke(lerpColor(colorLow, colorHigh, t));
    line(barX + i, barY, barX + i, barY + barH);
  }

  stroke("black")

  // triangolo minimo
  let hMin = elevMin / 150;
  let tx1 = barX;
  let ty1 = barY -10;

  fill(colorLow);
  triangle(
    tx1 - hMin*0.18, ty1,
    tx1, ty1 - hMin,
    tx1 + hMin*0.18, ty1
  );

  // triangolo massimo
  let hMax = elevMax / 150;
  let tx2 = barX + barW;
  let ty2 = barY + 10;

  fill(colorHigh);
  triangle(
    tx2 - hMax*0.18, ty2,
    tx2, ty2 - hMax,
    tx2 + hMax*0.18, ty2
  );

  // etichette sotto i due triangoli
  fill(220);
  textAlign(CENTER, TOP);
  textSize(11);
  text(int(elevMin) + ' m', tx1, barY + barH + 6);
  text(int(elevMax) + ' m', tx2, barY + barH + 6);
}


function drawHover() {
  // controlla se il mouse è sopra qualche triangolo (uso di point-in-triangle)
  let found = null;
  for (let v of vulcani) {
    if (!v.screen) continue;
    // vertici del triangolo usato in screen coords
    let x = v.screen.x, y = v.screen.y, h = v.screen.h;
    let A = createVector(x - h*0.18, y);
    let B = createVector(x, y - h);
    let C = createVector(x + h*0.18, y);
    if (pointInTriangle(createVector(mouseX, mouseY), A, B, C)) {
      found = v;
      break;
    }
  }

  if (found) {
    // tooltip nero trasparente con testo arancione
    let txt = found.name;
    let elevTxt = (' • ' + int(found.elev) + ' m');
    let w = max(160, textWidth(txt) + 24);
    let hx = mouseX - w/2;
    let hy = mouseY + 20;
    noStroke();
    fill(12, 160);
    rect(hx, hy, w, 34, 6);
    fill(255, 170, 0);
    textSize(13);
    textAlign(LEFT, CENTER);
    text(txt + elevTxt, hx + 10, hy + 17);
    // evidenzia il triangolo
    stroke(255, 200, 0);
    noStroke();
    fill("yellow");
    let x = found.screen.x, y = found.screen.y, h = found.screen.h;
    triangle(
    x - h*0.18, y,
    x, y - h,
    x + h*0.18, y)
  }
}

// punto nel triangolo usando barycentric technique
function pointInTriangle(p, a, b, c) {
  let area = (a.x - c.x)*(b.y - c.y) - (b.x - c.x)*(a.y - c.y);
  let s = ((a.x - c.x)*(p.y - c.y) - (a.y - c.y)*(p.x - c.x)) / area;
  let t = ((p.x - c.x)*(b.y - c.y) - (p.y - c.y)*(b.x - c.x)) / area;
  return s >= 0 && t >= 0 && (s + t) <= 1;
}
