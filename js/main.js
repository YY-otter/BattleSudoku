const calcPatternsWorker = new Worker("./js/calcPatterns.js");

const h1TitleElem = document.getElementById("h1Title");

const divContentsElem = document.getElementById("divContents");

const divBoardElem = document.getElementById("divBoard");
const tableBoardElem = document.getElementById("tableBoard");

const divInfoElem = document.getElementById("divInfo");
const patternNumElem = document.getElementById("patternNum");
const pSelectNumElem = document.getElementById("pSelectNum");
const selectedPosElem = document.getElementById("selectedPos");
const selectedNumElem = document.getElementById("selectedNum");
const viewResultElem = document.getElementById("viewResult");

const detailsOptionsElem = document.getElementById("detailsOptions");
const boardSizeElems = document.getElementsByName("boardSize");
const viewAnswerPatternElem = document.getElementById("viewAnswerPattern");
const rowPlayModeElem = document.getElementById("rowPlayMode");
const gameModeElems = document.getElementsByName("gameMode");
const rowPlayTurnElem = document.getElementById("rowPlayTurn");
const playTurnElems = document.getElementsByName("playTurn");

let playableFlag = false;
let playerTurnFlag = true;

let playerNum = 1;
let playerTurnNum = 0;

let boardSize = 4;
let answerPattern = 12;

let selectedPos = { y: 0, x: 0 };
let selectedNum = 0;

let viewAnswerPatternFlag = true;
let gameMode = 0;

let devilNum = 0;

class Message {
  constructor(funcName, valueArray) {
    this.funcName = funcName;
    this.valueArray = valueArray;
  }
}

/* https://stackoverflow.com/questions/901115/#901144 */
function getParam(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

calcPatternsWorker.addEventListener("message", (message) => {
  assignMessageToFunc(message.data);
}, false);

window.onload = function() {
  playableFlag = false;
  initializedFlag = { 4: false, 6: false };

  boardSizeElems[0].checked = true;
  viewAnswerPatternElem.checked = true;
  gameModeElems[0].checked = true;
  playTurnElems[0].checked = true;

  if (getParam("CPU")) {
    rowPlayModeElem.style.display = "";
    rowPlayTurnElem.style.display = "";
  }
  else {
    rowPlayModeElem.style.display = "none";
    rowPlayTurnElem.style.display = "none";
  }

  document.documentElement.style.setProperty("--board-td-line-height", "0");
  adjustBoardSize();

  const postCalcAllPatterns = new Message("calcAllPatterns", null);
  calcPatternsWorker.postMessage(postCalcAllPatterns);
}

window.onresize = function() {
  adjustBoardSize();
}

detailsOptionsElem.ontoggle = function() {
  adjustBoardSize();
}

function selectPos(y, x) {
  if (tableBoardElem.rows[y].cells[x].innerHTML === "" && playableFlag && playerTurnFlag) {
    selectedPos = { y: y, x: x };
    updateSelectedInfo();
  }
}

function selectNum(n) {
  if (playableFlag && playerTurnFlag) {
    selectedNum = n;
    updateSelectedInfo();
  }
}

function decideNum() {
  if (selectedNum !== 0 && selectedPos.y !== 0 && playableFlag && playerTurnFlag) {
    tableBoardElem.rows[selectedPos.y].cells[selectedPos.x].innerHTML = selectedNum;

    switch (boardSize) {
      case 4:
        devilNum++;

      case 6:
        viewResultElem.innerHTML = "Just a moment...";
        const postDecideNum = new Message("decideNum", { y: selectedPos.y, x: selectedPos.x, num: selectedNum });
        calcPatternsWorker.postMessage(postDecideNum);
        break;

      default:
        throw new Error("Unexpected board size");
    }
  }
}

function cancelNum(flag) {
  if ((playableFlag && playerTurnFlag) || flag) {
    selectedPos = { y: 0, x: 0 };
    selectedNum = 0;
    updateSelectedInfo();
  }
}

function resetGame() {
  playableFlag = false;

  let i;
  let j;

  for (i in boardSizeElems) {
    if (boardSizeElems[i].checked) {
      boardSize = parseInt(boardSizeElems[i].value);
      break;
    }
  }
  for (i in gameModeElems) {
    if (gameModeElems[i].checked) {
      gameMode = parseInt(gameModeElems[i].value);
      break;
    }
  }
  for (i in playTurnElems) {
    if (playTurnElems[i].checked) {
      playerTurnNum = parseInt(playTurnElems[i].value) - 1;
      break;
    }
  }

  switch (boardSize) {
    case 4:
      document.documentElement.style.setProperty("--board-td-font-size", "300%");
      break;

    case 6:
      document.documentElement.style.setProperty("--board-td-font-size", "200%");
      break;

    default:
      throw new Error("Unexpected board size");
  }

  const postResetGame = new Message("resetGame", boardSize);
  calcPatternsWorker.postMessage(postResetGame);

  while (tableBoardElem.firstChild) {
    tableBoardElem.removeChild(tableBoardElem.firstChild);
  }

  const newTh = document.createElement("th");

  for (i = 0; i <= boardSize; i++) {
    const newRow = tableBoardElem.insertRow(-1);

    for (j = 0; j <= boardSize; j++) {
      if (i === 0) {
        if (j !== 0) {
          newTh.innerHTML = String.fromCharCode(j + 64);
        }

        newRow.appendChild(newTh.cloneNode(true));
      }
      else {
        if (j === 0) {
          newTh.innerHTML = i;
          newRow.appendChild(newTh.cloneNode(true));
        }
        else {
          const newCell = newRow.insertCell(-1);

          newCell.setAttribute("onclick", "selectPos(" + i + ", " + j + ")");
        }
      }
    }
  }

  while (pSelectNumElem.firstChild) {
    pSelectNumElem.removeChild(pSelectNumElem.firstChild);
  }

  for (i = 1; i <= boardSize; i++) {
    const newButton = document.createElement("button");

    newButton.innerHTML = i;
    newButton.setAttribute("onclick", "selectNum(" + i + ")");

    pSelectNumElem.appendChild(newButton.cloneNode(true));
  }

  patternNumElem.style.color = "#000";
  cancelNum(true);

  viewResultElem.innerHTML = "Just a moment...";

  viewResultElem.style.color = "#000";
  devilNum = 0;

  if (gameMode === 0) {
    playerNum = 1;
  }
  else {
    playerNum = 2;
  }
}

function viewAnswerPattern(flag) {
  viewAnswerPatternFlag = flag;
  changePatternNum();
}

function assignMessageToFunc(message) {
  switch (message.funcName) {
    case "returnFromCalcAllPatterns":
      returnFromCalcAllPatterns(message.valueArray);
      break;
    case "returnFromUpdateAnswerPattern":
      returnFromUpdateAnswerPattern(message.valueArray);
      break;
    case "returnFromDecideNumByCPU":
      returnFromDecideNumByCPU(message.valueArray);
      break;

    default:
      throw new Error("Unexpected function name by main");
  }
}

function returnFromCalcAllPatterns() {
  resetGame();
}

function returnFromUpdateAnswerPattern(answerPatternNum) {
  answerPattern = answerPatternNum;
  changePatternNum();
  judgeGameEnd();
}

function returnFromDecideNumByCPU(posAndNumArray) {
  tableBoardElem.rows[posAndNumArray.y].cells[posAndNumArray.x].innerHTML = posAndNumArray.num;

  selectedPos = { y: posAndNumArray.y, x: posAndNumArray.x };
  selectedNum = posAndNumArray.num;
  updateSelectedInfo();
}

function adjustBoardSize() {
  const divContentsWidth = divContentsElem.getBoundingClientRect().width;
  const divContentsHeight = divContentsElem.getBoundingClientRect().height;
  const divInfoWidth = divInfoElem.getBoundingClientRect().width;
  const divInfoHeight = divInfoElem.getBoundingClientRect().height;

  let boardDisplayAreaSize;

  const boardFontSizeRatio = 0.05;

  if (divContentsWidth - divInfoWidth > divContentsHeight - divInfoHeight) {
    divContentsElem.style.flexDirection = "row";
    divContentsElem.style.justifyContent = "center";

    boardDisplayAreaSize = Math.min(divContentsHeight, divContentsWidth - divInfoWidth);

  }
  else {
    divContentsElem.style.flexDirection = "column";
    divContentsElem.style.justifyContent = "flex-start";

    boardDisplayAreaSize = Math.min(divContentsWidth, divContentsHeight - divInfoHeight);
  }

  divBoardElem.style.width = boardDisplayAreaSize + "px";
  divBoardElem.style.height = boardDisplayAreaSize + "px";

  tableBoardElem.style.fontSize = boardDisplayAreaSize * boardFontSizeRatio + "px";
}

function updateSelectedInfo() {
  let y;
  let x;

  for (y = 1; y <= boardSize; y++) {
    for (x = 1; x <= boardSize; x++) {
      tableBoardElem.rows[y].cells[x].style.boxShadow = "";
    }
  }

  if (selectedPos.y === 0) {
    selectedPosElem.innerHTML = "??";
  }
  else {
    selectedPosElem.innerHTML = String.fromCharCode(selectedPos.x + 64) + selectedPos.y;
    tableBoardElem.rows[selectedPos.y].cells[selectedPos.x].style.boxShadow = "0 0 0 0.1em #e00 inset"; /* 枠線スタイル */
  }

  if (selectedNum === 0) {
    selectedNumElem.innerHTML = "?";
  }
  else {
    selectedNumElem.innerHTML = selectedNum;
  }
}

function changePatternNum() {
  if (viewAnswerPatternFlag || answerPattern <= 1) {
    patternNumElem.innerHTML = answerPattern;
  }
  else {
    patternNumElem.innerHTML = "???";
  }
}

function judgeGameEnd() {
  if (answerPattern <= 1) {
    switch (answerPattern) {
      case 1:
        patternNumElem.style.color = "#e00";
        break;

      case 0:
        patternNumElem.style.color = "#00e";
        break;

      default:
        throw new Error("Unexpected answer pattern(fewer than are necessary)");
    }

    if (Boolean(answerPattern) === playerTurnFlag) {
      viewResultElem.innerHTML = "YOU WIN!!!";
      viewResultElem.style.color = "#e00";

      if (boardSize === 6 && gameMode === 3) {
        h1TitleElem.style.color = "#e00";
      }

      if (devilNum === 13) {
        rowPlayModeElem.style.display = "";
        rowPlayTurnElem.style.display = "";
      }
    }
    else {
      viewResultElem.innerHTML = "YOU LOSE...";
      viewResultElem.style.color = "#00e";
    }

    playableFlag = false;
  }
  else {
    selectedPos = { y: 0, x: 0 };
    selectedNum = 0;

    playerTurnNum++;

    changeTurn();
    playableFlag = true;
  }

  adjustBoardSize();
}

function changeTurn() {
  if (playerTurnNum >= playerNum) {
    playerTurnNum = 0;
  }

  if (playerTurnNum === 0) {
    playerTurnFlag = true;
  }
  else {
    playerTurnFlag = false;
  }

  if (playerTurnFlag) {
    switch (gameMode) {
      case 0:
        viewResultElem.innerHTML = "...";
        break;

      default:
        viewResultElem.innerHTML = "YOUR TURN";
    }
  }
  else {
    switch (gameMode) {
      case 0:
        viewResultElem.innerHTML = "...";
        break;
      default:
        viewResultElem.innerHTML = "CPU's TURN";
        switch (boardSize) {
          case 4:
          case 6:
            const postPlayByCPU = new Message("playByCPU", gameMode);
            calcPatternsWorker.postMessage(postPlayByCPU);
            break;

          default:
            throw new Error("Unexpected board size");
        }
    }
  }
}