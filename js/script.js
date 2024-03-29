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
    16. Translate the interface
    17. Theme switcher

*/


/* 1. Variables
----------------------------------------------------------------------------- */
let roll = 0,
    diceSum,
    scoreSum,
    highScore = getStorageItem('highScore', 0)

const boardFields = document.querySelectorAll('[data-el=board] output'),
      buttons = document.querySelectorAll('[data-el=board] button'),
      diceElements = document.querySelectorAll('.die'),
      liveRegion = document.querySelector('[aria-live]'),
      manualEl = document.querySelector('[data-el=manual]'),
      manualToggle = document.querySelector('[data-el=manual-toggle]'),
      settingsEl = document.querySelector('[data-el=settings]'),
      languageSelect = document.body.querySelector('[data-el=language-select]'),
      themeSwitch = document.querySelector('[data-el=theme-switch]'),
      animationsSwitch = document.querySelector('[data-el=animations-switch]'),
      highScoreEl = document.querySelector('[name=high-score]'),
      totalScoreEl = document.querySelector('[name=total-score]'),
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
// Add listener to all buttons on the board
for (let button of buttons) button.addEventListener('click', handleButtonClick)
// Keyboard controls
document.addEventListener('keydown', handleShortcuts)
// Trigger the translate function on change of the language <select> element
languageSelect.addEventListener('change', function(){translate(this.value)})
// Trigger the switchTheme function on change of the theme switch radio buttons
themeSwitch.addEventListener('change', switchTheme)
// Trigger the animation switch function on change of the toggle switch
animationsSwitch.addEventListener('change', toggleAnimations)


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

function toggleSettings(){
  // Toggle the settings dialog's visibility
  settingsEl.toggleAttribute('hidden')
  // Determine if it's opened or closed
  let currentState = (settingsEl.hasAttribute('hidden')) ? 'closed' : 'open'
  // If open, set focus on the element
  if (currentState === 'open') settingsEl.focus();
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
  if(this.hasAttribute('readonly')) return
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
        '[data-el=board] button:nth-child(5n + 1):not([value="0"])',
        '[name="diagonal-ttb"]' ],
      // Query for the 'top-left-to-bottom-right' diagonal
      diagonalBtt = [
        '[data-el=board] button:nth-child(7n):not([value="0"])',
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


/* 8. Build a set of button values from a querySelector
----------------------------------------------------------------------------- */
function buildSet(querySelector){
  // .1. Get the needed buttons with the query selectors
  let buttonSet = document.querySelectorAll(querySelector[0])
  // 2. Put every button's value in an array
  let setValues = new Array()
  for (let button of buttonSet) setValues.push(parseInt(button.value))
  // 3. If it contains 5 numbers, it's entirely filled
  return { 'numbers': setValues, 'elements': buttonSet }
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
      // Fill the score in the right output
      let output = document.querySelector(querySelector[1])
      output.value = score
      // Recalculate the total score
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
function handleShortcuts(e){
  // Check if the escape key has been hit
  if(e.keyCode == 27){
    // If so, and the settings are open, close them
    if (!settingsEl.hasAttribute('hidden')) toggleSettings()
    // Else, if the manual is open, close it
    else if (document.body.classList.contains('show-manual')) toggleManual()
  }
  // Check if the arrow keys have been hit
  if (e.keyCode > 36 && e.keyCode < 41) moveFocus(e)
}

function moveFocus(e){
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


/* 14. Toggle Manual
----------------------------------------------------------------------------- */
function toggleManual(e) {
  // 1. Toggle the CSS class on the body element so .board can be layed out
  document.body.classList.toggle('show-manual')
  // 2. Toggle the hidden attribute on the manual itself
  manualEl.toggleAttribute('hidden')
  // 3. Put the current state in a variable and store it in localStorage
  let currentState = (manualEl.hasAttribute('hidden')) ? 'closed' : 'open'
  localStorage.setItem('manual', currentState)
  // 4. Set the aria-pressed attribute on the toggle button
  if (currentState === 'open') manualToggle.setAttribute('aria-pressed', 'true')
  else manualToggle.removeAttribute('aria-pressed')
  // 5. Scroll the manual into view if needed
  manualEl.scrollIntoView()
  if (currentState === 'open') manualEl.focus()
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


/* 16. Translate the interface
----------------------------------------------------------------------------- */
// 1. Retreive the device's system language
const systemLanguage = navigator.language || navigator.systemLanguage
// 2. Check if there's a user preference for the language setting
let userLanguage = getStorageItem('language', systemLanguage)
// 3. If there's a preference other than English, translate the UI
if (!userLanguage.includes('en')) translate(userLanguage)

function translate(langCode){
  // 4. Retreive all elements that need translation
  const translatableElements = document.querySelectorAll('[data-t]')
  // 5. Check the javascript object to find the right language
  for (var translation of translations){
    // 6. If there's a match on language code
    if (translation['codes'].includes(langCode)) {
      // 7. Store the language preference
      localStorage.setItem('language', langCode)
      // 8. Change the language attribute on the html tag
      document.documentElement.lang = translation['codes'][0];
      // 9. Update the select value in the settings dialog
      document.forms['settings']['language'].value = langCode;
      // 10. Loop through every element
      for (var element of translatableElements){
        // 11. And replace the content with its translation
        element.innerHTML = translation[element.getAttribute('data-t')]
      }
    }
  }
}


/* 17. Theme switcher
----------------------------------------------------------------------------- */
function switchTheme(){
  let theme = document.forms.settings.theme.value
  document.documentElement.className = 'theme-' + theme
  localStorage.setItem('theme', theme)
}

let currentTheme = getStorageItem('theme', 'system')
if (currentTheme !== 'system') {
  document.forms['settings'][currentTheme].checked = true;
  switchTheme()
}


/* 18. Settings switches
----------------------------------------------------------------------------- */
function toggleAnimations(){
  let animations = 'on'
  if (!this.checked) animations = 'off'
  localStorage.setItem('animations', animations)
  document.documentElement.dataset.animations = animations
}

let currentAnimations = getStorageItem('animations', 'on')
if (currentAnimations === 'off') {
  document.forms['settings']['animations'].checked = false
  document.documentElement.dataset.animations = 'off'
}

// TODO: create generic approach for settings form updates