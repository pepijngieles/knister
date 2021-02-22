/*

		TABLE OF CONTENTS

		1. Variables
		2. Event listeners
		3. Generic functions
		4. Define logic for rolling the dice
		5. Handle clicks on the board's buttons
		6. Update a button's attributes
		7. Create a set of query selectors for the sequences and score fields
		8. Create a sequence of cell values from a querySelector
		9. Calculate a sequence's score
			- 9.1 Overall function, returning the score
			- 9.2 Full house
			- 9.3 Straight
			- 9.4 Two Pair
			- 9.5 Some of a kind
		10. Fill in a button's value
		11. Finish the game
		12. Keyboard controls
		13. On page load, roll the dice

*/


/* 1. Variables
----------------------------------------------------------------------------- */
var roll = 0,
		diceSum

const diceElements = document.querySelectorAll('.die'),
			diceSumEl = document.querySelector('.dice-sum'),
			scoreSumEl = document.querySelector('[name=score-sum]'),
			buttons = document.querySelectorAll('[data-canvas] button'),
			canvasFields = document.querySelectorAll('[data-canvas] input'),
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
for (var button of buttons) button.addEventListener('click', handleButtonClick)
// Game manual button
manualToggle.addEventListener('click', toggleManual)
// Keyboard controls
document.addEventListener('keydown', moveFocus)


/* 3. Generic functions
----------------------------------------------------------------------------- */
function getRandomNumber(range = [1,6], negative = false){
	var angle = Math.floor(Math.random()*range[1]) + range[0]
	if (negative) angle *= Math.round(Math.random()) ? 1 : -1
	return angle
}

function toggleManual(e) {
	// Toggle the CSS class on the body element
	document.body.classList.toggle('show-manual')
	// Put the current state in a variable
	var currentState = (document.body.classList.contains('show-manual')) ? 'open' : 'closed'
	// Store it in localStorage
	localStorage.setItem('manual', currentState)
}

if (localStorage.getItem('manual') == null) localStorage.setItem('manual', 'open')

var manualState = localStorage.getItem('manual')

if (manualState == 'closed') toggleManual()


/* 4. Define logic for rolling the dice
----------------------------------------------------------------------------- */
function rollDice(){
	// Set the dice sum to zero
	diceSum = 0;
	// For both dice
	for (var die of diceElements){
		// Generate a random number between 1 and 6
		var amount = getRandomNumber()
		// Add it to the dice sum
		diceSum += amount
		// Add it to the die element
		die.dataset.value = amount
		// Randomly position the die
		die.style.transform = 'rotate(' + getRandomNumber([0,15]) + 'deg)'
		die.style.margin = getRandomNumber([8,16]) + 'px'
	}
	// Update the live reagion for screen readers
	liveRegion.innerHTML = 'You rolled ' + diceSum
}


/* 5. Handle clicks on the board's buttons
----------------------------------------------------------------------------- */
function handleButtonClick(){
	// Don't allow clicks on already filled buttons
	if (this.readonly) return; /* readonly is used because disabled won't :focus*/
	// Update the button's attributes
	updateButtonAttributes(this)
	// Create query selectors needed to check if corresponding rows, columns
	// and diagonals are entirely filled
	var sequenceQs = createQuerySelectors(this)
	// Calculate and fill the value with the query selectors
	fillValue(sequenceQs)
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
	var oldLabel = button.getAttribute('aria-label')
	var newLabel = oldLabel.replace('Blank', diceSum)
	button.setAttribute('aria-label', newLabel)
}


/* 7. Create a set of query selectors for the sequences and score fields
----------------------------------------------------------------------------- */
function createQuerySelectors(button){
	return [
		[
			// Row of the clicked cell
			'[data-row="' + button.dataset.row + '"]:not([value="0"])',
			'[name="row-' + button.dataset.row + '"]'
		],
		[
			// Column of the clicked cell
			'[data-column="' + button.dataset.column + '"]:not([value="0"])',
			'[name="column-' + button.dataset.column + '"]'
		],
		[
			// Query for the 'bottom-left-to-top-right' diagonal
			'[data-canvas] button:nth-child(5n + 1):not([value="0"])',
			'[name="diagonal-ttb"]'
		],
		[
			// Query for the 'top-left-to-bottom-right' diagonal
			'[data-canvas] button:nth-child(7n):not([value="0"])',
			'[name="diagonal-btt"]'
		]
	];
}


/* 8. Create a sequence of cell values from a querySelector
----------------------------------------------------------------------------- */
function createSequence(querySelector){
	// .1. Get the needed cells with the query selectors
	var cells = document.querySelectorAll(querySelector[0])
	var sequence = new Array()
	// 2. Put every cell's value in an array
	for (var cell of cells) sequence.push(parseInt(cell.value))
	// 3. If it contains 5 numbers, it's entirely filled
	return sequence
}


/* 9. Calculate a sequence's score
----------------------------------------------------------------------------- */

	/* --- 9.1 Overall function, returning the score --- */
	function calculateScore(array){
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
		var i = 0
		while (array[i + 1] == (array[i] + 1) ) i++
		if (i == 4) return true
		else return false
	}

	/* --- 9.4 Two pair --- */
	function isTwoPair(array){
		// A pair of two in an ascending/descending array can be detected by
		// compairing each value to the next one and check if they're the same.
		// In total it should happen twice that they're not.
		var differences = 0;
		// Check every item
		for (var i = 0; i < array.length - 1; i++) {
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
		for (var i = 0; i < array.length; i++) {
			// Reset the counter to 0
			var counter = 0
			// Compary to every other value
			for (var j = 0; j < array.length; j++) {
				// If there's match, increase the counter
				if (array[j] == array[i]) counter++
			}
			// If some of a kind has been found, return it
			if (counter > 1) return counter
		}
		// Else, return false
		return false
	}


/* 10. Calculate and fill in a button's value
----------------------------------------------------------------------------- */
function fillValue(sequenceQs){
	// Check for every sequence if it's entirely filled
	for (var querySelector of sequenceQs){
		// Get the sequence
		var sequence = createSequence(querySelector)
		// If it contains 5 numbers, it's filled. Now calculate the score
		if (sequence.length == 5){
			// Calculate the score
			var score = calculateScore(sequence)
			// If it's the diagonal sequence, double the score
			if(querySelector[1].includes("diagonal")) score *= 2
			// Fill the score in the right cell
			var scoreCell = document.querySelector(querySelector[1])
			scoreCell.value = score
		}
	}
}


/* 11. Finish the game
----------------------------------------------------------------------------- */
function finishGame(){
	// Reset score to zero
	var scoreSum = 0;
	// Add up all values of the fields
	for (var field of canvasFields) scoreSum += Number(field.value)
	// Add the sum tot the field
	scoreSumEl.value = scoreSum
}


/* 12. Keyboard controls
----------------------------------------------------------------------------- */
function moveFocus(e){
	// Check if the arrow keys have been hit
	if (e.keyCode > 36 && e.keyCode < 41) {
		// Make sure the current focussed element is a grid cell
		if (e.target.dataset.row){
			// Get the current row and column
			var row = e.target.dataset.row
			var column = e.target.dataset.column
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
			//
			var qs = '[data-row="' + row + '"][data-column="' + column + '"]';
			var nextCell = document.body.querySelector(qs);
			//
			// Focus the right element
			nextCell.focus()
		}
	}
}


/* 13. On page load, roll the dice
----------------------------------------------------------------------------- */
rollDice()