/*

    TABLE OF CONTENTS

    1. Variables
    2. Event listeners
    3. Generic functions
    4. Define logic for rolling the dice
    5. Handle clicks on the board's buttons
    6. Update a button's attributes
    7. Build a set of query selectors for the sets and score fields
    8. Build a set of cell values from a querySelector
    9. Calculate a set's score
      - 9.1 Overall function, returning the score
      - 9.2 Full house
      - 9.3 Straight
      - 9.4 Two Pair
      - 9.5 Some of a kind
    10. Fill in a set's value
    11. Update scores
    12. Finish the game
    13. Keyboard controls
    14. Toggle Manual
    15. Prepare the board

*/


/* 1. Variables
----------------------------------------------------------------------------- */
let roll = 0,
    diceSum,
    scoreSum,
    highScore = getStorageItem('highScore', 0)

const diceElements = document.querySelectorAll('.die'),
      diceSumEl = document.querySelector('.dice-sum'),
      totalScoreEl = document.querySelector('[name=total-score]'),
      highScoreEl = document.querySelector('[name=high-score]'),
      buttons = document.querySelectorAll('[data-board] button'),
      boardFields = document.querySelectorAll('[data-board] input'),
      manualToggle = document.querySelector('.manual-toggle'),
      liveRegion = document.querySelector('[aria-live]'),
      scores = {
        '2-oak': '1',
        '3-oak': '3',
        '4-oak': '6',
        '5-oak': '10',
        'two-pair': '3',
        'full-house': '8',
        'low-straight': '8',
        'high-straight': '12'
      }


/* 2. Event listeners
----------------------------------------------------------------------------- */
// All buttons on the board
for (let button of buttons) button.addEventListener('click', handleButtonClick)
// Game manual button
manualToggle.addEventListener('click', toggleManual)
// Keyboard controls
document.addEventListener('keydown', moveFocus)


/* 3. Generic functions
----------------------------------------------------------------------------- */
function getRandomNumber(range = [1,6], negative = false){
  let angle = Math.floor(Math.random()*range[1]) + range[0]
  if (negative) angle *= Math.round(Math.random()) ? 1 : -1
  return angle
}

function getStorageItem(item, defaultValue){
  // Check if localStorage item exists. If not, create one
  if (localStorage.getItem(item) == null) localStorage.setItem(item, defaultValue)
  // Return the item's value
  return localStorage.getItem(item)
}


/* 4. Define logic for rolling the dice
----------------------------------------------------------------------------- */
function rollDice(){
  // Set the dice sum to zero
  diceSum = 0;
  // For both dice
  for (let die of diceElements){
    // Generate a random number between 1 and 6
    let amount = getRandomNumber()
    // Add it to the dice sum
    diceSum += amount
    // Add it to the die element
    die.dataset.value = amount
    // Randomly position the die
    die.style.transform = 'rotate(' + getRandomNumber([0,15], true) + 'deg)'
    die.style.margin = (getRandomNumber([5,12]) / 10) + 'rem'
    // Remove and, with a delay, add the show class to animate in
    die.classList.remove('show');
    setTimeout(function(){
      die.classList.add('show')
    },240)
  }
  // Update the live reagion for screen readers
  liveRegion.innerHTML = 'You rolled ' + diceSum
}


/* 5. Handle clicks on the board's buttons
----------------------------------------------------------------------------- */
function handleButtonClick(){
  // Don't allow clicks on already filled buttons
  // Using [readonly] because [disabled] won't allow :focus
  if (this.getAttribute('readonly')) return
  // Update the button's attributes
  updateButtonAttributes(this)
  // Reset the animation classes for every button
  for (let el of buttons) el.classList.remove('animate', 'row', 'column')
  // Create query selectors needed to check if corresponding rows, columns
  // and diagonals are entirely filled
  let setQs = buildQuerySelectors(this)
  // Calculate and fill the value with the query selectors
  fillSetValue(setQs)
  // Keep track of the amount of rolls
  roll++
  // Check if the game is finished
  if (roll == 25) finishGame()
  // If not finished, roll the dice again
  else rollDice()
}


/* 6. Update a button's attributes
----------------------------------------------------------------------------- */
function updateButtonAttributes(button){
  // Change the clicked button's attributes
  button.value = diceSum
  button.innerHTML = diceSum
  button.setAttribute('readonly', 'true')
  // Update the aria-label attribute for screen readers
  let oldLabel = button.getAttribute('aria-label')
  let newLabel = oldLabel.replace('Blank', diceSum)
  button.setAttribute('aria-label', newLabel)
}


/* 7. Build a set of query selectors for the sets and score fields
----------------------------------------------------------------------------- */
// 1. Create constant variables for the diagonal query selectors
      // Query for the 'bottom-left-to-top-right' diagonal
const diagonalTtb = [    
        '[data-board] button:nth-child(5n + 1):not([value="0"])',
        '[name="diagonal-ttb"]' ],
      // Query for the 'top-left-to-bottom-right' diagonal
      diagonalBtt = [
        '[data-board] button:nth-child(7n):not([value="0"])',
        '[name="diagonal-btt"]' ]

function buildQuerySelectors(button){
  // 2. Create a variable to hold the query selectors
  let setQs = [[
      // Row of the clicked cell
      '[data-row="' + button.dataset.row + '"]:not([value="0"])',
      '[name="row-' + button.dataset.row + '"]'
    ],[
      // Column of the clicked cell
      '[data-column="' + button.dataset.column + '"]:not([value="0"])',
      '[name="column-' + button.dataset.column + '"]'
    ]]
 // 3. Add diagonals if needed
  let els = document.body.querySelectorAll(diagonalTtb[0])
  for (let el of els){
    if (el == button) {
      setQs.push(diagonalTtb)
    }
  }

  els = document.body.querySelectorAll(diagonalBtt[0])
  for (let el of els){
    if (el == button) {
      setQs.push(diagonalBtt)
    }
  }
  // 4. Return the variable
  return setQs;
}


/* 8. Build a set of cell values from a querySelector
----------------------------------------------------------------------------- */
function buildSet(querySelector){
  // .1. Get the needed cells with the query selectors
  let cells = document.querySelectorAll(querySelector[0])
  let set = new Array()
  // 2. Put every cell's value in an array
  for (let cell of cells) set.push(parseInt(cell.value))
  // 3. If it contains 5 numbers, it's entirely filled
  return { 'numbers': set, 'elements': cells }
}


/* 9. Calculate a set's score
----------------------------------------------------------------------------- */

  /* --- 9.1 Overall function, returning the score --- */
  function calculateSetScore(array){
    // Sort array from low to high, the logic depends on this order
    array.sort(function(a, b){return a-b})
    // Check for the possible scores, in the right order
    if (isSomeOak(array) == 5) return scores['5-oak']
    if (isStraight(array)) {
      // Check if it contains a 7 or not
      if(array.includes(7)) return scores['low-straight']
      else return scores['high-straight']
    }
    if (isFullHouse(array)) return scores['full-house']
    if (isTwoPair(array)) return scores['two-pair'];
    if (isSomeOak(array)) return scores[isSomeOak(array) + '-oak']
    // Else, no score
    return 0
  }

  /* --- 9.2 Full house --- */
  function isFullHouse(array){
    if ( ((array[0] === array[1]) && (array[2] === array[4])) ||
         ((array[0] === array[2]) && (array[3] === array[4])) ) {
      return true
    }
  }

  /* --- 9.3 Straight --- */
  function isStraight(array){
    let i = 0
    while (array[i + 1] == (array[i] + 1) ) i++
    if (i == 4) return true
    else return false
  }

  /* --- 9.4 Two pair --- */
  function isTwoPair(array){
    // A pair of two in an ascending/descending array can be detected by
    // compairing each value to the next one and check if they're the same.
    // In total it should happen twice that they're not.
    let differences = 0;
    // Check every item
    for (let i = 0; i < array.length - 1; i++) {
      // Keep track of differences
      if(array[i] !== array[i + 1]) differences++
    }
    // If total amount is 2, it's two pair
    if (differences === 2) return true;
    else return false;
  }

  /* --- 9.5 Some of a kind --- */
  function isSomeOak(array){
    // For every item of the array...
    for (let i = 0; i < array.length; i++) {
      // Reset the counter to 0
      let counter = 0
      // Compary to every other value
      for (let j = 0; j < array.length; j++) {
        // If there's match, increase the counter
        if (array[j] == array[i]) counter++
      }
      // If some of a kind has been found, return it
      if (counter > 1) return counter
    }
    // Else, return false
    return false
  }


/* 10. Fill in a set's value
----------------------------------------------------------------------------- */
function fillSetValue(setQs){
  // Check for every set if it's entirely filled
  for (let querySelector of setQs){
    // Get the set
    let set = buildSet(querySelector)
    // If it contains 5 numbers, it's filled. Now calculate the score
    if (set.numbers.length == 5){
      // Calculate the score
      let score = calculateSetScore(set.numbers)
      // If it's the diagonal set, double the score
      if(querySelector[1].includes("diagonal")) score *= 2
      // Fill the score in the right cell
      let scoreCell = document.querySelector(querySelector[1])
      scoreCell.value = score
      //
      updateTotalScore()
      // 10.2 Animation
      // Determine which direction this set is, needed for the animation
      let direction = (querySelector[0].includes('column')) ? 'column' : 'row'
      // Add the .animate and .row or .column classes to every element
      for (let el of set.elements) el.classList.add('animate', direction)
    }
  }
}


/* 11. Update scores
----------------------------------------------------------------------------- */
function updateTotalScore(){
  // Reset score to zero
  scoreSum = 0
  // Add up all values of the fields
  for (let field of boardFields) scoreSum += Number(field.value)
  // Add the sum tot the field
  totalScoreEl.value = scoreSum
  totalScoreEl.setAttribute('aria-label', 'Your current game score is ' + scoreSum)
}

function updateHighScore(score){
  highScore = score
  localStorage.setItem('highScore', highScore)
  highScoreEl.value = highScore
  highScoreEl.setAttribute('aria-label', 'Your high score is ' + highScore)
}


/* 12. Finish the game
----------------------------------------------------------------------------- */
function finishGame(){
  // Check if total score is higher than the high score
  if (scoreSum > highScore) updateHighScore(scoreSum)
}


/* 13. Keyboard controls
----------------------------------------------------------------------------- */
function moveFocus(e){
  // Check if the arrow keys have been hit
  if (e.keyCode > 36 && e.keyCode < 41) {
    // Make sure the current focussed element is a grid cell
    if (e.target.dataset.row){
      // Get the current row and column
      let row = e.target.dataset.row
      let column = e.target.dataset.column
      // Adjust according to the pressed key
      if (e.keyCode == 37) column--
      if (e.keyCode == 38) row--
      if (e.keyCode == 39) column++
      if (e.keyCode == 40) row++
      // Handle edge cases
      if (row == 6) row = 1
      if (row == 0) row = 5
      if (column == 6) column = 1
      if (column == 0) column = 5
      // Create a query selector to retreive the next cell
      let qs = '[data-row="' + row + '"][data-column="' + column + '"]'
      let nextCell = document.body.querySelector(qs)
      // Focus the right element
      nextCell.focus()
    }
    // If there's no focus on an element yet, move it to the first button
    else if(!document.querySelector(':focus')) buttons[0].focus()
  }
}


/* 14. Toggle Manual
----------------------------------------------------------------------------- */
function toggleManual(e) {
  // Toggle the CSS class on the body element
  document.body.classList.toggle('show-manual')
  // Put the current state in a variable
  let manualOpened = document.body.classList.contains('show-manual')
  let currentState = (manualOpened) ? 'open' : 'closed'
  // Store it in localStorage
  localStorage.setItem('manual', currentState)
}

// Close manual if needed
if (getStorageItem('manual', 'open') == 'closed') toggleManual()


/* 15. Prepare the board
----------------------------------------------------------------------------- */
function prepareBoard(){
  // Retreive the high score from localStorage and update the field
  updateHighScore(highScore)
  // TODO: after every board button click, remember the gameState and retrieve
  // it from localStorage on page load to then fill in
}

prepareBoard()
rollDice()