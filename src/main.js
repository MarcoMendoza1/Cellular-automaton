import { Application, Container, Graphics, Sprite, Texture,Rectangle } from "pixi.js";
import { Viewport } from 'pixi-viewport'

////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Variables globales

const CELL_SIZE = 10;

let root = document.getElementById("simulador");
let simulador;
let grid;
let cells;
let conCells;
let btnCells;
let tam;
let col=0xFFFFFF;

// Iteraciones de la cuadricula, indicador del paso actual
let history=[];
let ind = 0;


let cellGraph = new Graphics()
                  .setFillStyle({ color: 'white',alpha:.4 })
                  .rect(0, 0, 1, 1)
                  .fill()
                  .stroke({ color: 0xffffff, pixelLine: true });
let cellContext;

// Textura de las celulas pre-creada para aumentar eficiencia
const baseTexture = Texture.WHITE;

////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Funciones para el simulador (acciones, funcionalidades)

// onClick de cada celula
function onTap(){
  history[history.length-1][this.i][this.j]=cells[this.i][this.j].visible=!cells[this.i][this.j].visible;
}

function buildGrid(graphics, cols, rows){
  graphics.clear();
  for (let i = 0; i < cols + 1; i++)
  {
      graphics
          .moveTo(i * (CELL_SIZE + 1), 0)
          .lineTo(i * (CELL_SIZE + 1), (CELL_SIZE + 1) * rows);
  }

  for (let i = 0; i < rows + 1; i++)
  {
      graphics
          .moveTo(0, i * (CELL_SIZE + 1))
          .lineTo((CELL_SIZE + 1)*cols, i * (CELL_SIZE + 1));
  }
  graphics.stroke({ color: 0xffffff, pixelLine: true, width: 1,alpha:.2 });

  // graphics.cacheAsTexture(false);
  // graphics.cacheAsTexture(true);

  return graphics;
}

function buildCells(conCells,cols,rows){
  for (let i = 0; i < cells.length; i++) {
    for (let j = 0; j < cells[i].length; j++) {
      cells[i][j].destroy();
      btnCells[i][j].destroy();
    } 
  }

  history = [];
  ind = 0;

  cells = new Array(cols);
  btnCells = new Array(cols);
  let act = new Array(cols);
  for(let i = 0;i<cols;i++){
    cells[i] = new Array(rows);
    btnCells[i] = new Array(rows);
    act[i] = new Array(rows);

    for(let j=0;j<rows;j++){
      act[i][j] = 0;
      let cell = new Sprite(baseTexture);
      let cell2 = new Sprite();
      cell.alive = 1;

      cell.x=i * (CELL_SIZE + 1)+3;
      cell.y=j * (CELL_SIZE + 1)+3;

      cell.width = 5;
      cell.height = 5;
      cell.alpha = .5;
      cell2.alpha=0;
      cell.tint = (col);
      cell.visible=false;


      cell2.cursor='pointer';
      cell2.eventMode = 'static';
      
      cell2.x=cell.x-3;
      cell2.y=cell.y-3;
      cell2.width=cell2.height = CELL_SIZE;
      cell2.i=i;
      cell2.j=j;

      cell2.on('mousedown',onTap);

      conCells.addChild(cell,cell2);
      cells[i][j]=cell;
      btnCells[i][j]=cell2;

    }

  }

  history.push(act);

}

// Aparecer o desaparecer celulas de acuerdo a la iteracion actual
function actualizarCelulas(){
  for(let i = 0;i<tam;i++){
    for(let j=0;j<tam;j++){
        cells[i][j].visible=history[ind][i][j];
    }
  }
}

// Cambiar color de las celulas
function cambiarColor(color){
  for(let i = 0;i<tam;i++){
    for(let j=0;j<tam;j++){
        cells[i][j].tint=color;
    }
  }
}

// Generar siguiente iteracion
function siguienteIteracion(history, tam) {
  // Obtener la última matriz de la historia (la matriz actual)
  const matriz = history[history.length - 1];

  let siguienteMatriz = Array.from({ length: tam }, () => Array(tam).fill(0));

  // Función para contar los vecinos vivos de una celda
  function contarVecinosVivos(fila, col) {
      let contador = 0;
      // Verificar las 8 direcciones alrededor de la celda (esquinas incluidas)
      for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
              if (i === 0 && j === 0) continue; // No contar la propia celda
              const nuevaFila = fila + i;
              const nuevaCol = col + j;
              if (nuevaFila >= 0 && nuevaFila < tam && nuevaCol >= 0 && nuevaCol < tam) {
                  if (matriz[nuevaCol][nuevaFila] === true) {
                      contador++;
                  }
              }
          }
      }
      return contador;
  }

  // Recorrer cada celda de la matriz actual y calcular su siguiente estado
  for (let col = 0; col < tam; col++) {
    for (let fila = 0; fila < tam; fila++) {
          const vecinosVivos = contarVecinosVivos(fila, col);
          
          // Si la celda es viva
          if (matriz[col][fila] === 1) {
              // La celda sobrevive si tiene 2 o 3 vecinos vivos
              if (vecinosVivos === 2 || vecinosVivos === 3) {
                  siguienteMatriz[col][fila] = true;
              } else {
                  siguienteMatriz[col][fila] = false;
              }
          } 
          // Si la celda está muerta
          else {
              // La celda revive si tiene exactamente 3 vecinos vivos
              if (vecinosVivos === 3) {
                  siguienteMatriz[col][fila] = true;
              }
          }
      }
  }

  history.push(siguienteMatriz);

  ind++;
  return siguienteMatriz;
}

function reiniciarSimulador(){
  buildGrid(grid, tam, tam);
  buildCells(conCells,tam,tam);

  simulador.x=root.clientWidth/2;
  simulador.y=root.clientHeight/2;
  
  simulador.pivot.x= simulador.width/2;
  simulador.pivot.y= simulador.height/2;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Inicializacion del simulador

(async () => {
    const app = new Application();
    globalThis.__PIXI_APP__ = app;

    await app.init({ resizeTo: root, preference:"webgpu" });
    app.ticker.maxFPS = 20;
    app.ticker.minFPS = 1;

    // create viewport
  const viewport = new Viewport({
    screenWidth: app.canvas.width,
    screenHeight: app.canvas.height,
    worldWidth: 1000,
    worldHeight: 1000,
    stopPropagation:true,
    passiveWheel:false,
    events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
  });

// add the viewport to the stage
app.stage.addChild(viewport);

// activate plugins
viewport.drag().wheel();

  simulador = new Container();
  let gridContainer = new Container({isRenderGroup:true});
  tam = 100;
  grid = buildGrid(new Graphics(),100,100);
  gridContainer.addChild(grid);
  grid.eventMode = "static";
  grid.hitArea = new Rectangle(0, 0, grid.width,grid.height);
  grid.on("pointerdown",(event)=>{
    let local = grid.toLocal(event);
    console.log(local.x,local.y);
  });
  

  simulador.addChild(gridContainer);
  viewport.addChild|(simulador);

  simulador.x=root.clientWidth/2;
  simulador.y=root.clientHeight/2;

  simulador.pivot.x= simulador.width/2;
  simulador.pivot.y= simulador.height/2;

  
  conCells = new Container();
  simulador.addChild(conCells);

  cellContext = app.renderer.generateTexture(cellGraph);

  cells = [];
  buildCells(conCells,100,100);

// add a red box
  viewport.addChild(simulador);

  root.appendChild(app.canvas);
})();


////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Listeners

document.getElementById("num").addEventListener('change', (e) => {
  tam = parseInt(e.target.value);;

  reiniciarSimulador();
});


document.getElementById("colorAlive").addEventListener("change", function() {
  console.log("Color cambiado.");
  let nuevo = parseInt(this.value.substring(1),16);

  cambiarColor(nuevo);
  col=nuevo;

});

// Paso único
document.getElementById("stepBtn").addEventListener("click", function() {
  console.log("Iteración paso a paso ejecutada.");
  siguienteIteracion(history,tam);
  
  actualizarCelulas();

});

let intervalId = null;

// Iniciar simulación continua
document.getElementById("playBtn").addEventListener("click", function() {
  console.log("▶Simulación iniciada.");
  if (!intervalId) { // Si no se está ejecutando ya
    intervalId = setInterval(() => {
      siguienteIteracion(history,tam);
      actualizarCelulas();
    }, 200); // 200 ms por generación
    console.log("Simulación iniciada.");
  }
});

// Detener simulación
document.getElementById("stopBtn").addEventListener("click", function() {
  console.log("⏹Simulación detenida.");
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Simulación detenida.");
  }
});

// Limpiar espacio celular
document.getElementById("clearBtn").addEventListener("click", function() {
  console.log("Espacio limpiado.");
  reiniciarSimulador();
});

// Guardar configuración
document.getElementById("saveBtn").addEventListener("click", function() {
  console.log("Guardando configuración.");
});

// Cargar archivo
/*document.getElementById("load").addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (file) {
    console.log("Archivo seleccionado:", file.name);
  }
});*/


