/* puzzle/puzzle.js - logic for 15-puzzle mini-game */
document.addEventListener('DOMContentLoaded', ()=>{
  // UI references
  const openBtn = document.getElementById('openPuzzle');
  const modal = document.getElementById('puzzleModal');
  const closeBtn = document.getElementById('closePuzzle');
  const boardEl = document.getElementById('puzzleBoard');
  const movesEl = document.getElementById('puzzleMoves');
  const timerEl = document.getElementById('puzzleTimer');
  const shuffleBtn = document.getElementById('puzzleShuffle');
  const winEl = document.getElementById('puzzleWin');
  const bestEl = document.getElementById('puzzleBest');

  const SIZE = 4; // 4x4
  let tiles = []; // numbers 1..15 and 0 as blank
  let moves = 0;
  let timer = 0; let timerInterval = null;

  function startTimer(){
    stopTimer();
    timer = 0; timerEl.textContent = '0s';
    timerInterval = setInterval(()=>{ timer++; timerEl.textContent = timer + 's'; }, 1000);
  }
  function stopTimer(){ if(timerInterval){ clearInterval(timerInterval); timerInterval = null; } }

  function createSolved(){
    const a = [];
    for(let i=1;i<=SIZE*SIZE-1;i++) a.push(i);
    a.push(0);
    return a;
  }

  // count inversions to check solvability
  function inversions(arr){
    const a = arr.filter(n=>n!==0);
    let inv=0;
    for(let i=0;i<a.length;i++) for(let j=i+1;j<a.length;j++) if(a[i]>a[j]) inv++;
    return inv;
  }

  function solvable(arr){
    const inv = inversions(arr);
    const blankRowFromBottom = SIZE - Math.floor(arr.indexOf(0) / SIZE);
    if(SIZE%2===0){
      return (blankRowFromBottom%2===0) !== (inv%2===1);
    }
    return inv%2===0;
  }

  function shuffle(){
    let a;
    do{
      a = createSolved();
      // Fisher-Yates shuffle
      for(let i=a.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [a[i],a[j]]=[a[j],a[i]];
      }
    } while(!solvable(a) || isSolved(a));
    tiles = a; moves = 0; movesEl.textContent = moves; render(); startTimer(); winEl.classList.remove('show'); bestEl.textContent = '';
  }

  function isSolved(arr=tiles){
    for(let i=0;i<arr.length-1;i++) if(arr[i] !== i+1) return false;
    return arr[arr.length-1]===0;
  }

  function render(){
    boardEl.innerHTML='';
    for(let i=0;i<tiles.length;i++){
      const n = tiles[i];
      const tile = document.createElement('div');
      tile.className = 'tile';
      if(n===0){ tile.classList.add('blank'); tile.setAttribute('aria-hidden','true'); }
      else tile.textContent = n;
      tile.dataset.index = i;
      tile.addEventListener('click', onTileClick);
      boardEl.appendChild(tile);
    }
  }

  function swap(i,j){ [tiles[i],tiles[j]]=[tiles[j],tiles[i]]; }

  function onTileClick(e){
    const idx = Number(e.currentTarget.dataset.index);
    const blankIdx = tiles.indexOf(0);
    const can = canMove(idx, blankIdx);
    if(can){ swap(idx, blankIdx); moves++; movesEl.textContent = moves; render();
      if(isSolved()){ onWin(); }
    }
  }

  // tile can move if adjacent to blank
  function canMove(idx, blankIdx){
    const xi = idx % SIZE, yi = Math.floor(idx/SIZE);
    const xb = blankIdx % SIZE, yb = Math.floor(blankIdx/SIZE);
    const dx = Math.abs(xi-xb), dy = Math.abs(yi-yb);
    return (dx+dy)===1;
  }

  function onWin(){
    stopTimer();
    winEl.classList.add('show');
    // update best in localStorage
    const bestKey = 'puzzle-best';
    const prev = Number(localStorage.getItem(bestKey) || 0);
    const score = moves*100 + timer; // lower is better
    if(prev===0 || score < prev){
      localStorage.setItem(bestKey, String(score));
      bestEl.textContent = 'Nuevo mejor: ' + moves + ' movimientos, ' + timer + 's';
    } else {
      bestEl.textContent = 'Mejor: ' + prev + ' (menor es mejor)';
    }
  }

  // keyboard support - arrows move tiles into the blank if possible
  function onKey(e){
    const blankIdx = tiles.indexOf(0);
    const x = blankIdx % SIZE, y = Math.floor(blankIdx/SIZE);
    let target = null;
    switch(e.key){
      case 'ArrowUp': target = (y+1<SIZE) ? (blankIdx+SIZE) : null; break;
      case 'ArrowDown': target = (y-1>=0) ? (blankIdx-SIZE) : null; break;
      case 'ArrowLeft': target = (x+1<SIZE) ? (blankIdx+1) : null; break;
      case 'ArrowRight': target = (x-1>=0) ? (blankIdx-1) : null; break;
    }
    if(target!==null){ swap(target, blankIdx); moves++; movesEl.textContent = moves; render(); if(isSolved()) onWin(); }
  }

  // Public actions
  shuffleBtn.addEventListener('click', shuffle);

  openBtn.addEventListener('click', ()=>{ modal.classList.add('open'); shuffle(); document.addEventListener('keydown', onKey); });
  closeBtn.addEventListener('click', ()=>{ modal.classList.remove('open'); stopTimer(); document.removeEventListener('keydown', onKey); });

  // initialize with solved board
  tiles = createSolved(); render(); movesEl.textContent = moves; timerEl.textContent = '0s';
});
