import { Application, Container, Graphics, Sprite, Texture,Rectangle } from "pixi.js";
import { Viewport } from 'pixi-viewport'
import {Decimal} from 'decimal.js';

////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Variables globales

const CELL_SIZE = 10;

let root = document.getElementById("simulador");
let header = document.getElementById("header");
let vivas = document.getElementById("liveCells");
let iteracion = document.getElementById("iteracion");

let simulador;
let grid;
let conCells;
let conGrid;
let contorno;

let tam;
let col=0xFFFFFF;
let cv = 0;

// Iteraciones de la cuadricula, indicador del paso actual
let ind = 0;
let liveCells = new Map();
let arrayCells = [];
let modo = "nulo";

let reglaB = new Set();
let reglaS = new Set();

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

function addCell(cord){
  cv++;
  vivas.value = cv;
  let aux = cord.split(',');
  let x = aux[0];
  let y = aux[1];

  let cell = new Sprite(baseTexture);

  cell.x=x * (CELL_SIZE + 1)+1.5;
  cell.y=y * (CELL_SIZE + 1)+1.5;

  cell.width = 8;
  cell.height = 8;
  cell.alpha = .9;
  cell.tint = (col);
  cell.visible=true;

  conCells.addChild(cell);
  liveCells.set(cord,cell);
}

function removeCell(cord){
  let cell = liveCells.get(cord);
  cell.destroy();
  liveCells.delete(cord);

  cv--;
  vivas.value = cv;
}

// onClick de cada celula
function onTap(cord){
  // history[history.length-1][this.i][this.j]=cells[this.i][this.j].visible=!cells[this.i][this.j].visible;
  
  if(liveCells.has(cord)){
    removeCell(cord);
  }else{
    addCell(cord);
  }
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


  return graphics;
}

// Cambiar color de las celulas
function cambiarColor(color){
  liveCells.forEach( (val,key) => {
    val.tint=color;
  });
}

// Generar siguiente iteracion
function siguienteIteracion(){
  ind++;
  iteracion.value = ind;

  let newCells = new Set();

  // Función para contar los vecinos vivos de una celda
  function obteneVecinos(cord) {
    let aux = cord.split(',');
    let col = parseInt(aux[0]);
    let fila = parseInt(aux[1]);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let nuevaFila = fila + j;
        let nuevaCol = col + i;

        if(modo == "toro"){
          if(nuevaCol == -1 ) nuevaCol = tam-1;
          if(nuevaFila == -1 ) nuevaFila = tam-1;

          if(nuevaCol == tam ) nuevaCol = 0;
          if(nuevaFila == tam ) nuevaFila = 0;
        }else if(modo=="nulo"){
          if(nuevaCol < 0 || nuevaFila < 0 || nuevaCol >= tam || nuevaFila >= tam) continue;
        }

        const cord = nuevaCol + "," + nuevaFila;
        
        if(!newCells.has(cord)){
          newCells.add(cord);
        }
      }
    }
  }

  //regresa el numero de vecinos vivos de una celula
  function obteneVecinosVivos(cord) {
    let aux = cord.split(',');
    let col = parseInt(aux[0]);
    let fila = parseInt(aux[1]);
    let contador = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if(i==0 && j==0) continue;
        let nuevaFila = fila + j;
        let nuevaCol = col + i;

        if(modo == "toro"){
          if(nuevaCol == -1 ) nuevaCol = tam-1;
          if(nuevaFila == -1 ) nuevaFila = tam-1;

          if(nuevaCol == tam ) nuevaCol = 0;
          if(nuevaFila == tam ) nuevaFila = 0;
        }

        const cord = nuevaCol + "," + nuevaFila;
        
        if(liveCells.has(cord)){
          contador++;
        }
      }
    }
    return contador;
  }

  liveCells.forEach( (val,key) => {
    obteneVecinos(key);
  });

  let newLiveCells = [];
  let deadCells = [];

  newCells.forEach( (val) => {
    let cont = obteneVecinosVivos(val);
    if(liveCells.has(val)){ //celula viva
      if(!reglaS.has(cont)){ //muere
        deadCells.push(val);
      }else{  //vive
        newLiveCells.push(val);
      }

    }else{  //muerta
      if(reglaB.has(cont)){  //vive
        newLiveCells.push(val);
      }
    }
  });

  deadCells.forEach( (val) => {
    removeCell(val);
  });

  newLiveCells.forEach( (val) => {
    if(!liveCells.has(val)){
      addCell(val);
    }
  });
  
}

function reiniciarSimulador(){
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Simulación detenida.");
  }

  ind = 0;
  cv = 0;

  iteracion.value = ind;
  vivas.value = cv;

  buildGrid(grid, tam, tam);

  liveCells.forEach( (val,key) => {
    val.destroy();
  });
  liveCells.clear();

  contorno.clear();  

  simulador.x=root.clientWidth/2 - conGrid.width/2;
  simulador.y=root.clientHeight/2 - conGrid.height/2;

  contorno.rect(0,0,(CELL_SIZE + 1)*tam - .01,(CELL_SIZE + 1)*tam - .01)
          .stroke({ color: "red", pixelLine: true, width: 1 })
          .fill({ color: "red", pixelLine: true, width: 1,alpha:.05 });;

  simulador.hitArea = new Rectangle(0, 0, conGrid.width,conGrid.height);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Inicializacion del simulador

(async () => {
  tam = 100;

  reglaB.add(3);
  reglaS.add(2);
  reglaS.add(3);

  const app = new Application();
  globalThis.__PIXI_APP__ = app;

  await app.init({ resizeTo: root, preference:"webgpu" });
  app.ticker.maxFPS = 45;
  app.ticker.minFPS = 1;

  simulador = new Container();
  conGrid = new Container({isRenderGroup:true});
  grid = buildGrid(new Graphics(),tam,tam);
  grid.hitArea = new Rectangle(0, 0, grid.width,grid.height);

  contorno = new Graphics().rect(0,0,(CELL_SIZE + 1)*tam - .01,(CELL_SIZE + 1)*tam - .01)
                           .stroke({ color: "red", pixelLine: true, width: 1 })
                           .fill({ color: "red", pixelLine: true, width: 1,alpha:.05 });


  conGrid.addChild(grid,contorno);

  simulador.addChild(conGrid);
  simulador.eventMode = "static";
  simulador.hitArea = new Rectangle(0, 0, conGrid.width,conGrid.height);
  simulador.on("pointertap",(event)=>{
      
      let x=( (event.x-viewport.x)/viewport.scale.x) - simulador.x;
      let y=( (event.y-header.clientHeight -viewport.y)/viewport.scale.y) - simulador.y;

      let i = Math.floor(x/(CELL_SIZE + 1));
      let j = Math.floor(y/(CELL_SIZE + 1));

      onTap(i + "," + j);

      console.log(x,y);
      console.log(i, j);

  });

  simulador.x=root.clientWidth/2 - conGrid.width/2;
  simulador.y=root.clientHeight/2 - conGrid.height/2;
  
  conCells = new Container();
  conCells.interactiveChildren = false;
  simulador.addChild(conCells);

  cellContext = app.renderer.generateTexture(cellGraph);

  // create viewport
  const viewport = new Viewport({
    // screenWidth: app.canvas.width,
    // screenHeight: app.canvas.height,
    // worldWidth: 1000,
    // worldHeight: 1000,
    stopPropagation:true,
    passiveWheel:false,
    events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
  });
  
  // activate plugins
  viewport.drag().wheel();

  viewport.on("zoomed-end", () => {
    if(viewport.scale.x < 0.70){
      grid.renderable  = false;
    }else{
      grid.renderable  = true;
    }
  });

  // add a red box
  viewport.addChild(simulador);
  // add the viewport to the stage
  app.stage.addChild(viewport);

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
  
  //actualizarCelulas();

});

let intervalId = null;

// Iniciar simulación continua
document.getElementById("playBtn").addEventListener("click", function() {
  console.log("▶Simulación iniciada.");
  if (!intervalId) { // Si no se está ejecutando ya
    intervalId = setInterval(() => {
      siguienteIteracion(history,tam);
    }, 20); // 200 ms por generación
    console.log("Simulación iniciada.");
  }
});

// Detener simulación
document.getElementById("stopBtn").addEventListener("click", function() {
  console.log("Simulación detenida.");
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

// Cambiar modo de frontera
document.getElementById("frontera").addEventListener("change", function() {
  modo = this.value;
  console.log(modo);
});

// Cambiar regla
document.getElementById("rule").addEventListener("change", function() {
  let aux = this.value.split('/');
  aux[0] = aux[0].substring(1);
  aux[1] = aux[1].substring(1);

  console.log(aux);

  reglaB.clear();
  reglaS.clear();

  for(let i = 0;i<aux[0].length;i++){
    reglaB.add(parseInt(aux[0][i]));
  }

  for(let i = 0;i<aux[1].length;i++){
    reglaS.add(parseInt(aux[1][i]));
  }

});

// Cargar archivo
/*document.getElementById("load").addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (file) {
    console.log("Archivo seleccionado:", file.name);
  }
});*/


