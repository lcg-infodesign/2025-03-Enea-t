// Margine esterno per non disegnare sui bordi del canvas
let outerMargin = 100;

// Variabile che conterrà i dati caricati dal CSV
let data;

function preload() {
  // Carico il file CSV nella cartella "assets"
  // Il terzo parametro ("header") indica che la prima riga del file contiene i nomi delle colonne
  data = loadTable("assets/data.csv", "csv", "header");
}

function setup() {
  // Crea un canvas che riempie tutta la finestra del browser
  createCanvas(windowWidth, windowHeight);


  // --- DEFINIZIONE DELLE SCALE ---

  // Scala per la longitudine → asse X
  let allLon = data.getColumn("Longitude");
  minLon = min(allLon);
  maxLon = max(allLon);

  // Scala per la latitudine → asse Y
  let allLat = data.getColumn("Latitude");
  minLat = min(allLat);
  maxLat = max(allLat);
}

function draw() {
  // Sfondo nero
  background(10);

  // --- CICLO PRINCIPALE: disegna un triangolo per ogni riga del dataset ---
  for (let rowNumber = 0; rowNumber < data.getRowCount(); rowNumber++) {
    // Leggo i dati dalle colonne del CSV
    let lat = data.getNum(rowNumber, "Latitude");
    let lon = data.getNum(rowNumber, "Longitude");
    let elev = data.getNum(rowNumber, "Elevation");

    // Converto le coordinate geografiche in coordinate del canvas
    let x = map(lon, -180, 180, outerMargin, width - outerMargin);
    let y = map(lat, -90, 90, height - outerMargin, outerMargin);
    let h = elev/200

    //disegno il triangolo
    triangle(
      x-5, y,
      x+5, y,
      x, y-h
    )
    console.log(rowNumber)
  }
}