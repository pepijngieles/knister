// 1. Variables
var roll = 0
var diceSum

const diceElements = document.querySelectorAll('.die'),
			diceSumEl = document.querySelector('.dice-sum'),
			scoreSumEl = document.querySelector('[name=score-sum]'),
			buttons = document.querySelectorAll('[data-canvas] button'),
			canvasFields = document.querySelectorAll('[data-canvas] input')

var scores = {
	'2-oak': '1',
	'3-oak': '3',
	'4-oak': '6',
	'5-oak': '10',
	'two-pair': '3',
	'full-house': '8',
	'low-straight': '8',
	'high-straight': '12'
}

// 2. Generate random numbers
function getRandomNumber(range = [1,6], negative = false){
	var angle = Math.floor(Math.random()*range[1]) + range[0]
	if (negative) angle *= Math.round(Math.random()) ? 1 : -1
	return angle
}

// 3. Add event listeners to the buttons
for (var button of buttons){
	button.addEventListener('click', fillValue)
}

// 4. Define logic for rolling dice
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
}

// 5. Fill in the value from the dice
function fillValue(){

	// 5.1 Change the clicked button's content
	this.value = diceSum
	this.innerHTML = diceSum
	this.disabled = true

	// 5.2 Create query selectors needed to check if corresponding rows, columns
	// and diagonals are entirely filled
	var sequenceQs = createQuerySelectors(this)

	// 5.3 Check for every sequence if it's entirely filled
	for (var querySelector of sequenceQs){
		// Get the needed cells with the query selectors
		var cells = document.querySelectorAll(querySelector[0])
		var sequence = new Array()
		// Put every cell's value in an array
		for (var cell of cells) sequence.push(parseInt(cell.value))
		// If it contains 5 numbers, it's filled. Now calculate the score
		if (cells.length == 5){
			// Retrieve the cell that holds the score
			var scoreCell = document.querySelector(querySelector[1])
			// Calculate the score
			var score = calculateScore(sequence)
			// If it's the diagonal sequence, double the score
			if(querySelector[1].includes("diagonal")) score *= 2
			// Fill in the score
			scoreCell.value = score
		}
	}

	// 5.4 Keep track of the amount of rolls to check if the game is finished
	roll++
	if (roll == 25) finishGame()

	// 5.5 If game is not finished, roll the dice again
	else rollDice()
}
	
// 6. Create a set of query selectors for the sequences and score fields
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

// 7. Calculate a sequence's score
function calculateScore(array){

	// Sort array from low to high, the logic depends on this order
	array.sort(function(a, b){return a-b})

	// Start off first with "five of a kind" because the full-house-logic would
	// also return true for this
	if (isSomeOak(array) == 5) return scores['5-oak']

	// Check if it's a straight
	if (isStraight(array)) {
		// Check if it contains a 7 or not
		if(array.includes(7)) return scores['low-straight']
		else return scores['high-straight']
	}

	// Now check if it's full house before checking 'some of a kind'
	if (isFullHouse(array)) return scores['full-house']

	// Check if the array contains two pair
	if (isTwoPair(array)) return scores['two-pair'];

	// If is some of a kind
	if (isSomeOak(array)) return scores[isSomeOak(array) + '-oak']

	// Else,
	return 0
}

	function isFullHouse(array){
		if ( ((array[0] === array[1]) && (array[2] === array[4])) ||
				 ((array[0] === array[2]) && (array[3] === array[4])) ) {
			return true
		}
	}

	function isStraight(array){
		var i = 0
		while (array[i + 1] == (array[i] + 1) ) i++
		if (i == 4) return true
		else return false
	}

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

	// Check if a sequence is "X of a kind"
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

// 8. Finish the game
function finishGame(){
	// Reset score to zero
	var scoreSum = 0;
	// Add up all values of the fields
	for (var field of canvasFields) scoreSum += Number(field.value)
	// Add the sum tot the field
	scoreSumEl.value = scoreSum
}

// 9. On page load, roll the dice
rollDice()