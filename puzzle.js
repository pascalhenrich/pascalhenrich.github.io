var canvas = document.querySelector('#puzzle');
var ctx = canvas.getContext('2d', { willReadFrequently: true });
var video;
var operationMode;
var started;
var originalVideoWidth;
var originalVideoHeigth;
var canvasVideoWidth;
var canvasVideoHeight;
var columns;
var rows;
var originColumnWidth;
var originRowHeight;
var canvasColumnWidth;
var canvasRowHeight;
var placementGrid;
var puzzlePieces;
var piece;
var offsetX;
var offsetY;
class PuzzlePiece {
    column;
    row;
    originPostion;
    canvasPosition;
    constructor(column, row) {
        this.column = column;
        this.row = row;
        this.originPostion = new Position(originColumnWidth * this.column, originRowHeight * this.row);
        this.initCanvasPosition();
    }
    draw() {
        ctx.drawImage(video, this.originPostion.x, this.originPostion.y, originColumnWidth, originRowHeight, this.canvasPosition.x, this.canvasPosition.y, canvasColumnWidth, canvasRowHeight);
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.rect(this.canvasPosition.x, this.canvasPosition.y, canvasColumnWidth, canvasRowHeight);
        ctx.stroke();
    }
    snap(event) {
        let position = findNearesGridPlace(event);
        if (position != null) {
            this.canvasPosition = position;
        }
    }
    correctPosition() {
        if (this.canvasPosition.x == placementGrid.x + this.column * canvasColumnWidth
            && this.canvasPosition.y == placementGrid.y + this.row * canvasRowHeight) {
            return true;
        }
        else {
            return false;
        }
    }
    updateCanvasPosition() {
        this.canvasPosition = randomPosition();
    }
    initCanvasPosition() {
        this.canvasPosition = new Position(placementGrid.x + this.column * canvasColumnWidth, placementGrid.y + this.row * canvasRowHeight);
    }
}
class Position {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
var Mode;
(function (Mode) {
    Mode[Mode["Desktop"] = 0] = "Desktop";
    Mode[Mode["Mobile"] = 1] = "Mobile";
})(Mode || (Mode = {}));
function main() {
    // Init empty piece array
    puzzlePieces = [];
    // Setup video
    video = document.createElement("video");
    video.id = "video";
    video.setAttribute("autoplay", "1");
    // Get video stream
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
        video.srcObject = stream;
        originalVideoWidth = stream.getTracks()[0].getSettings().width;
        originalVideoHeigth = stream.getTracks()[0].getSettings().height;
        setupValues();
        setOperationMode();
        video.onloadeddata = () => {
            initGrid();
            update();
            initListener();
        };
    })
        .catch(function (error) {
        console.log("Error!");
    });
}
function setupValues() {
    // Canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Set video dimensions
    let ratioFactor = Math.min(canvas.width / originalVideoWidth, canvas.height / originalVideoHeigth);
    canvasVideoWidth = 0.7 * ratioFactor * originalVideoWidth;
    canvasVideoHeight = 0.7 * ratioFactor * originalVideoHeigth;
    // Set columns and rows
    columns = 4;
    rows = 4;
    originColumnWidth = originalVideoWidth / columns;
    originRowHeight = originalVideoHeigth / rows;
    canvasColumnWidth = 0.7 * ratioFactor * originColumnWidth;
    canvasRowHeight = 0.7 * ratioFactor * originRowHeight;
    //
    placementGrid = new Position(canvas.width / 2 - canvasVideoWidth / 2, canvas.height / 2 - canvasVideoHeight / 2);
}
function initGrid() {
    for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
            puzzlePieces.push(new PuzzlePiece(i, j));
        }
    }
}
function update() {
    if (checkAllInCorrectPosition()) {
        console.log("fertig");
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawForeground();
    window.requestAnimationFrame(update);
}
function drawForeground() {
    for (let i = 0; i < puzzlePieces.length; i++) {
        puzzlePieces[i].draw();
    }
}
function drawBackground() {
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.lineWidth = 4;
    for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
            ctx.rect(placementGrid.x + canvasColumnWidth * i, placementGrid.y + canvasRowHeight * j, canvasColumnWidth, canvasRowHeight);
        }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
}
function initListener() {
    addEventListener('mousedown', (event) => {
        piece = getPieceOutOfGrid(event.x, event.y);
        if (piece != null) {
            offsetX = (event.x - piece.canvasPosition.x);
            offsetY = (event.y - piece.canvasPosition.y);
        }
    });
    addEventListener('mousemove', (event) => {
        if (piece != null) {
            piece.canvasPosition.x = event.x - offsetX;
            piece.canvasPosition.y = event.y - offsetY;
        }
    });
    addEventListener('mouseup', (event) => {
        if (piece != null) {
            piece.snap(event);
            piece = null;
        }
    });
    addEventListener('resize', (event => {
        setupValues();
        setOperationMode();
        for (let i = 0; i < puzzlePieces.length; i++) {
            if (started) {
                puzzlePieces[i].updateCanvasPosition();
            }
            else {
                puzzlePieces[i].initCanvasPosition();
            }
        }
    }));
}
function setOperationMode() {
    if (canvasColumnWidth + 10 >= placementGrid.x || canvas.width <= 1000) {
        operationMode = Mode.Mobile;
    }
    else {
        operationMode = Mode.Desktop;
    }
}
function getPieceOutOfGrid(x, y) {
    for (let i = puzzlePieces.length - 1; i >= 0; i--) {
        let areaX = puzzlePieces[i].canvasPosition.x + canvasColumnWidth;
        let areaY = puzzlePieces[i].canvasPosition.y + canvasRowHeight;
        if (x >= puzzlePieces[i].canvasPosition.x && x <= areaX && y >= puzzlePieces[i].canvasPosition.y && y <= areaY) {
            return puzzlePieces[i];
        }
    }
    return null;
}
function findNearesGridPlace(event) {
    let mousePosition = new Position(event.x, event.y);
    if (mousePosition.x >= placementGrid.x
        && mousePosition.x < placementGrid.x + canvasVideoWidth
        && mousePosition.y >= placementGrid.y
        && mousePosition.y < placementGrid.y + canvasVideoHeight) {
        let mouseColumn = Math.floor((mousePosition.x - placementGrid.x) / canvasColumnWidth);
        let mouseRow = Math.floor((mousePosition.y - placementGrid.y) / canvasRowHeight);
        return new Position(mouseColumn * canvasColumnWidth + placementGrid.x, mouseRow * canvasRowHeight + placementGrid.y);
    }
    return null;
}
function checkAllInCorrectPosition() {
    let checkArray = [];
    for (let i = 0; i < puzzlePieces.length; i++) {
        checkArray.push(puzzlePieces[i].correctPosition());
    }
    return !checkArray.includes(false);
}
function randomPosition() {
    let site = Math.round(Math.random());
    if (operationMode == Mode.Desktop) {
        if (site == 0) {
            return new Position(Math.random() * (placementGrid.x - canvasColumnWidth), Math.random() * (canvas.height - canvasRowHeight));
        }
        else {
            return new Position(placementGrid.x + canvasVideoWidth + Math.random() * (canvas.width - placementGrid.x - canvasVideoWidth - canvasColumnWidth), Math.random() * (canvas.height - canvasRowHeight));
        }
    }
    else if (operationMode == Mode.Mobile) {
        if (site == 0) {
            return new Position(Math.random() * (canvas.width - canvasColumnWidth), Math.random() * (placementGrid.y - canvasRowHeight));
        }
        else {
            return new Position(Math.random() * (canvas.width - canvasColumnWidth), placementGrid.y + canvasVideoHeight + Math.random() * (canvas.height - placementGrid.y - canvasVideoHeight - canvasRowHeight));
        }
    }
}
function start() {
    started = true;
    for (let i = 0; i < puzzlePieces.length; i++) {
        puzzlePieces[i].updateCanvasPosition();
    }
    canvas.scrollIntoView({ block: "start", inline: "nearest", behavior: "smooth" });
}
