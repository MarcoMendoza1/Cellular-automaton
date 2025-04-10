import { Application, Container, Graphics, Sprite, Texture, GraphicsContext } from "pixi.js";
import { Viewport } from 'pixi-viewport'

const CELL_SIZE = 15;

let root = document.getElementById("simulador");
let simulador;
let grid;
let cells;
let conCells;
let tam;

let cellGraph = new GraphicsContext()
                  .setFillStyle({ color: 'white',alpha:.4 })
                  .rect(0, 0, 9, 9)
                  .fill();

let cellContext = Texture.WHITE;

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

function buildCells(conCells,cols,rows){
  for (let i = 0; i < cells.length; i++) {
    for (let j = 0; j < cells[i].length; j++) {
      cells[i][j].destroy();
    } 
  } 

  cells = new Array(cols);
  for(let i = 0;i<cols;i++){
    cells[i] = new Array(rows);

    for(let j=0;j<rows;j++){
      let cell = new Sprite(cellContext);
      cell.alive = 1;

      cell.x=i * (CELL_SIZE + 1)+4;
      cell.y=j * (CELL_SIZE + 1)+4;

      cell.width = 9;
      cell.height = 9;

      conCells.addChild(cell);
      cells[i][j]=cell;

    }

  }

}

document.getElementById("num").addEventListener('change', (e) => {
  const val = parseInt(e.target.value);
  tam = val;

  buildGrid(grid, val, val);
  buildCells(conCells,val,val);

  simulador.x=root.clientWidth/2;
  simulador.y=root.clientHeight/2;
  
  simulador.pivot.x= simulador.width/2;
  simulador.pivot.y= simulador.height/2;
});



(async () => {
    const app = new Application();
    globalThis.__PIXI_APP__ = app;

    await app.init({ resizeTo: root });

    // create viewport
const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  worldWidth: 1000,
  worldHeight: 1000,
  stopPropagation:true,
  events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
});

// add the viewport to the stage
app.stage.addChild(viewport);

// activate plugins
viewport.drag().pinch().wheel().decelerate();

  simulador = new Container({isRenderGroup:true});
  tam = 10;
  grid = buildGrid(new Graphics(),10,10);

  simulador.addChild(grid);
  viewport.addChild|(simulador);

  simulador.x=root.clientWidth/2;
  simulador.y=root.clientHeight/2;

  simulador.pivot.x= simulador.width/2;
  simulador.pivot.y= simulador.height/2;

  
  conCells = new Container({isRenderGroup:true});
  simulador.addChild(conCells);

  //cellContext = app.renderer.generateTexture(cellGraph);

  cells = [];
  buildCells(conCells,10,10);

// add a red box
  viewport.addChild(simulador);

  root.appendChild(app.canvas);
})();
