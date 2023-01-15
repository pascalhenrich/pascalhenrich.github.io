var body: HTMLBodyElement;
var startDiv: HTMLDivElement;
var canvas: HTMLCanvasElement;
var ctx: CanvasRenderingContext2D; 
var video: HTMLVideoElement;
var usermedia;

var operationMode: Mode;

var startDate: number;
var endDate: number;
var username: string;
var highScoreList: Score[];
var finished: boolean;

var originalVideoWidth: number;
var originalVideoHeigth: number;
var canvasVideoWidth: number;
var canvasVideoHeight: number;
var columns: number;
var rows: number;
var originColumnWidth: number;
var originRowHeight: number;
var canvasColumnWidth: number;
var canvasRowHeight: number;
var placementGrid: Position;

var puzzlePieces: PuzzlePiece[];
var piece: PuzzlePiece;
var initMovePosition: Position;
var offsetX: number;
var offsetY: number;
var lastTouch: Position;

class Score{
    name: string;
    time: number;

    constructor(name: string, time: number){
        this.name = name;
        this.time = time;
    }
}

class PuzzlePiece{
    column: number;
    row: number;
    originPostion: Position;
    canvasPosition: Position;
    
    constructor(column, row){
        this.column = column;
        this.row = row; 
        this.originPostion = new Position(originColumnWidth * this.column, originRowHeight * this.row);
        this.randomizeCanvasPosition();
    }

    draw(): void{
        ctx.drawImage(video, this.originPostion.x, this.originPostion.y,
            originColumnWidth, originRowHeight,
            this.canvasPosition.x, this.canvasPosition.y,
            canvasColumnWidth,canvasRowHeight);
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.rect(this.canvasPosition.x, this.canvasPosition.y, canvasColumnWidth, canvasRowHeight);
        ctx.stroke();
    }

    snap(piecePosition: Position){
        let position: Position = findNearesGridPlace(piecePosition);
        if (position != null){
            this.canvasPosition = position;
        }
    }

    correctPosition(): boolean{
        if (this.canvasPosition.x == placementGrid.x+this.column*canvasColumnWidth
            && this.canvasPosition.y == placementGrid.y+this.row*canvasRowHeight){
                return true;
        } else {
            return false;
        }
    }

    randomizeCanvasPosition(): void{
        this.canvasPosition = randomPosition();       
    }
}

class Position{
    x: number;
    y: number

    constructor(x, y){
        this.x = x;
        this.y = y;
    }
}

enum Mode {
    Desktop,
    Mobile
}

/**
 * Is called when site is loaded
 */
function onLoadStart(){
    initData();
    body = document.body as HTMLBodyElement;
    startDiv = document.createElement("div");
    startDiv.id = "startDiv";
    body.appendChild(startDiv);
    createTable();
    createStartButton();
}

/**
 * Creates a div with a button which starts the puzzle and an input field
 */
function createStartButton(){
    let div = document.createElement("div");
    let divInput = document.createElement("div");
    let form = document.createElement("form");
    let input = document.createElement("input")
    let label = document.createElement("label");
    let br = document.createElement("br");
    label.htmlFor ="fname"
    label.innerHTML = "Name:";
    input.name = "fname";
    input.type = "text";
    form.appendChild(label);
    form.appendChild(br);
    form.appendChild(input);
    divInput.appendChild(form);
    divInput.id = "inputDiv";
    let divButton = document.createElement("div");
    divButton.id = "buttonDiv";
    let button = document.createElement("button");
    button.innerHTML = "Start!";
    divButton.appendChild(button);
    div.appendChild(divButton);
    div.appendChild(divInput);
    div.id = "left";
    startDiv.appendChild(div);
    body.appendChild(startDiv);
    button.addEventListener("click", (event) => {
        if (input.value != ""){
            username = input.value;
            startDiv.parentNode.removeChild(startDiv);
            startDiv = null;
            start();
        } else {
            alert("Kein kültiger Nutzername!")
        }
      });
}

/**
 * Creates highscore table
 */
function createTable(){
    let div = document.createElement("div");
    let divTable = document.createElement("div");
    let divText = document.createElement("div");
    let h1 = document.createElement("h1");
    h1.innerHTML = "HighScore";
    divText.id = "textDiv";
    divText.appendChild(h1);
    divTable.id = "tableDiv";
    let table = document.createElement("table");
    let headerRow = document.createElement("tr");
    let headers = ["Name", "Score"]
    console.log(headers);
    headers.forEach((text)=>{
        let header = document.createElement("th");
        header.innerHTML = text;
        headerRow.appendChild(header);
    });
    table.appendChild(headerRow);
    highScoreList.sort((a,b) => {
        if (a.time < b.time){
            return -1;
        } else if (a.time > b.time) {
            return 1;
        } else {
            return 0;
        }
    });
    for (let i = 0; i < 10; i++){
        let row = document.createElement("tr");
        let nameCell = document.createElement("td");
        let scoreCell = document.createElement("td");
        nameCell.innerHTML = highScoreList[i].name;
        scoreCell.innerHTML =  highScoreList[i].time.toString();
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        table.appendChild(row);
    }
    divTable.appendChild(table);
    div.appendChild(divText);
    div.appendChild(divTable);
    div.id="right"
    startDiv.appendChild(div);
    body.appendChild(startDiv);
}

/**
 * Loads old highscore data
 */
function initData(){
    highScoreList = [
        {
            "name": "Admin",
            "time": 1337
        },
        {
            "name": "User1",
            "time": 769494
        },
        {
            "name": "User2",
            "time": 399877
        },
        {
            "name": "User3",
            "time": 234983
        },
        {
            "name": "User4",
            "time": 890983
        },
        {
            "name": "User5",
            "time": 768689
        },
        {
            "name": "User6",
            "time": 856489
        },
        {
            "name": "User7",
            "time": 489645
        },
        {
            "name": "User8",
            "time": 314894
        },
        {
            "name": "User9",
            "time": 654489
        }
    ];
}


/**
 * Starts the puzzle environment
 */
function start(){
    finished = false,
    startDate = Date.now();
    setupTry();
    main();
}

/**
 * Init main game loop
 */
function main(){
    usermedia = navigator.mediaDevices.getUserMedia({video: true})
    .then(function (stream){
        video.srcObject = stream;
        originalVideoWidth = stream.getTracks()[0].getSettings().width;
        originalVideoHeigth = stream.getTracks()[0].getSettings().height;
        setupDimensions();
        setOperationMode();
        video.onloadeddata = () => {
            initGrid();
            shufflePieces();
            update();
            initListener();
        }
    })
    .catch(function (error){
        console.log("Error!")
    })
}

/**
 * Needs to get called before every try
 */
function setupTry(){
    puzzlePieces = [];
    createCanvas();
}

/**
 * Creates a canvas with video
 */
function createCanvas(){
    canvas = document.createElement("canvas");
    canvas.id = "game";
    body.appendChild(canvas);
    ctx = canvas.getContext('2d',{ willReadFrequently: true });
    video = document.createElement("video");
    video.id = "video";
    video.setAttribute("autoplay", "");  
    video.setAttribute("playsinline", "");
}

/**
 * Shuffles the pieces
 */
function shufflePieces(){
    for (let i = 0; i < puzzlePieces.length; i++){
        puzzlePieces[i].randomizeCanvasPosition();
    }
}

/**
 * Sets the dimensions
 */
function setupDimensions(){
    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Set video dimensions
    let ratioFactor = Math.min(canvas.width / originalVideoWidth, canvas.height / originalVideoHeigth)
    canvasVideoWidth = 0.7 * ratioFactor * originalVideoWidth;
    canvasVideoHeight = 0.7 * ratioFactor * originalVideoHeigth;
    // Set columns and rows
    columns = 4;
    rows = 4;
    originColumnWidth = originalVideoWidth/columns;
    originRowHeight = originalVideoHeigth/rows;
    canvasColumnWidth = 0.7 * ratioFactor * originColumnWidth;
    canvasRowHeight =  0.7 * ratioFactor * originRowHeight;
    //
    placementGrid = new Position(canvas.width/2-canvasVideoWidth/2,canvas.height/2-canvasVideoHeight/2);
}

/**
 * Initialize the puzzle pieces
 */
function initGrid(){
    for (let i = 0; i < columns; i++){
        for (let j = 0; j < rows; j++){
            puzzlePieces.push(new PuzzlePiece(i,j))
        }
    }
}

/**
 * Updates the frame and checks if finished
 */
function update(){
    if (!finished){
        if (checkAllInCorrectPosition()){
            endDate = Date.now();
            finished = true;
            highScoreList.push(new Score(username, endDate-startDate));
            canvas.parentNode.removeChild(canvas);
            usermedia = null;
            startDiv = document.createElement("div");
            startDiv.id = "startDiv";
            body.appendChild(startDiv);
            createTable();
            createStartButton();
            alert("Geschafft! Deine Zeit war: "+ (endDate-startDate)/1000 + "s");
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawForeground();
        window.requestAnimationFrame(update);
    }
}

/**
 * Draw puzzle pieces
 */
function drawForeground(){
    for(let i = 0; i < puzzlePieces.length; i++){
        puzzlePieces[i].draw();
    }
}

/**
 * Draw grid to place
 */
function drawBackground(){
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.lineWidth = 4;
    for (let i = 0; i < columns; i++){
        for (let j = 0; j < rows; j++){
            ctx.rect(
                placementGrid.x + canvasColumnWidth*i,
                placementGrid.y + canvasRowHeight*j,
                canvasColumnWidth,
                canvasRowHeight
                );
        }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
}

/**
 * Initialize eventlistener
 */
function initListener(){
    addEventListener("mousedown", (event) => {
        piece = getPieceOutOfGrid(new Position(event.x,event.y));
        if (piece != null){
            offsetX = (event.x - piece.canvasPosition.x);
            offsetY = (event.y - piece.canvasPosition.y);
        }        
    });
    addEventListener("mousemove", (event) => {
        if (piece != null){
            piece.canvasPosition.x = event.x-offsetX;
            piece.canvasPosition.y = event.y-offsetY;
        }
    });
    addEventListener("mouseup", (event) => {
        if (piece != null) {
            piece.snap(new Position(event.x,event.y));
            piece = null;
        }
    });
    addEventListener("touchstart", (event) => {
        piece = getPieceOutOfGrid(new Position(event.touches[0].clientX, event.touches[0].clientY));
        if (piece != null){            
            offsetX = (event.touches[0].clientX - piece.canvasPosition.x);
            offsetY = (event.touches[0].clientY - piece.canvasPosition.y);
        }        
    });
    addEventListener("touchmove", (event) => {
        if (piece != null){
            piece.canvasPosition = new Position(event.touches[0].clientX - offsetX, event.touches[0].clientY - offsetY);
            lastTouch = new Position(event.touches[0].clientX, event.touches[0].clientY);
        }
    });
    addEventListener("touchend", (event) => {
        console.log(event);
        if (piece != null) {
            piece.snap(lastTouch);
            piece = null;
        }
    });
    addEventListener("resize", (event) => {
        setupDimensions();
        setOperationMode();
        canvas.parentNode.removeChild(canvas);
        canvas = null;
        usermedia = null;
        startDiv = document.createElement("div");
        startDiv.id = "startDiv";
        body.appendChild(startDiv);
        createTable();
        createStartButton();
        alert("Das Verändern der Fenstergröße hat Sie bestimmt Zeit gekostet. Starten Sie lieber neu!")
    });
}

/**
 * Sets operation mode
 */
function setOperationMode(){
    if (canvasColumnWidth + 10 >= placementGrid.x || canvas.width <= 1000){
        operationMode = Mode.Mobile;
        
    } else {
        operationMode = Mode.Desktop;
    }
}

/**
 * Gets the piece on top of a stack at the position
 * @param x x-coordinate
 * @param y y-coordinate
 * @returns PuzzlePiece at position
 */
function getPieceOutOfGrid(mousePosition): PuzzlePiece{
    for(let i = puzzlePieces.length-1; i >= 0; i--){
        let areaX = puzzlePieces[i].canvasPosition.x + canvasColumnWidth;
        let areaY = puzzlePieces[i].canvasPosition.y + canvasRowHeight;
        if (mousePosition.x >= puzzlePieces[i].canvasPosition.x && mousePosition.x <= areaX && mousePosition.y>= puzzlePieces[i].canvasPosition.y && mousePosition.y <= areaY){
            return puzzlePieces[i];
        }
    }
    return null;
}

/**
 * Searches for the neares grid place for position
 * @param event mouse event
 * @returns Position
 */
function findNearesGridPlace(mousePosition: Position): Position{
    if (mousePosition.x >= placementGrid.x 
        && mousePosition.x < placementGrid.x + canvasVideoWidth
        && mousePosition.y >= placementGrid.y 
        && mousePosition.y < placementGrid.y + canvasVideoHeight){
            let mouseColumn = Math.floor((mousePosition.x-placementGrid.x)/canvasColumnWidth);
            let mouseRow =  Math.floor((mousePosition.y-placementGrid.y)/canvasRowHeight);
            return new Position(mouseColumn*canvasColumnWidth + placementGrid.x, mouseRow*canvasRowHeight+placementGrid.y);
        }
    return null;
}

/**
 * Checks if all pieces are in the correct postion
 * @returns true if all in correct position
 */
function checkAllInCorrectPosition(): boolean{
    let checkArray: boolean[] = [];
    for (let i = 0; i < puzzlePieces.length; i++){
        checkArray.push(puzzlePieces[i].correctPosition());
    }
    return !checkArray.includes(false);
}

/**
 * Returns a random position for a mode
 * @returns random postion
 */
function randomPosition(): Position{
    let site = Math.round(Math.random());
    if (operationMode == Mode.Desktop){
        if (site == 0){
            return new Position(
                Math.random() * (placementGrid.x-canvasColumnWidth),
                Math.random() * (canvas.height - canvasRowHeight)
            );
        } else {
            return new Position(
                placementGrid.x + canvasVideoWidth + Math.random() * (canvas.width - placementGrid.x - canvasVideoWidth - canvasColumnWidth),
                Math.random() * (canvas.height - canvasRowHeight)
            );
        }
    } else if (operationMode == Mode.Mobile){
        if (site == 0){
            return new Position(
                Math.random() * (canvas.width-canvasColumnWidth),
                Math.random() * (placementGrid.y - canvasRowHeight)
            );
        } else {
            return new Position(
                Math.random() * (canvas.width-canvasColumnWidth),
                placementGrid.y + canvasVideoHeight + Math.random() * (canvas.height - placementGrid.y - canvasVideoHeight - canvasRowHeight)
            );
        }
    }
}