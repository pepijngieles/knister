/* Translation
----------------------------------------------------------------------------- */

// Create variable that holds all translations
const translations = [
  {
    'codes': ['nl', 'nl-BE'],
    'title': 'Knister',
    'description': 'Knister is een dobbelspel ontworpen door Heinz Wüppen waar je punten verdiend door Yhatzee-achtige combinaties in een 5x5 grid te maken.',
    'manual-button': 'Toon Handleiding',
    'hiw-t': 'Hoe het werkt',
    'hiw-p': 'Vul na elke worp de som van de dobbelstenen in door op een hokje te klikken. Punten worden verdiend door combinaties te maken in de rijen, kolommen en diagonalen. Cijfers mogen in willekeurige volgorde worden ingevuld, diagonalen tellen dubbel. Na 25 worpen, wanneer het grid gevuld is, wordt de totale score berekend.',
    'cmb-t': 'Combinaties',
    'cmb-i1': 'Tweeling',
    'cmb-i2': 'Twee tweelingen',
    'cmb-i3': 'Drieling',
    'cmb-i4': 'Vierling',
    'cmb-i5': 'Full House',
    'cmb-i6': 'Straat',
    'cmb-i7': 'Vijfling',
    'cmb-i8': 'Straat zonder 7',
    }
]

// Retreive the user's system language
const userLanguage = navigator.language || navigator.userLanguage
// If it's not English, start translation
if (!userLanguage.includes('en')) translate()

function translate(){
  // Retreive all elements that need translation
  const translatableElements = document.querySelectorAll('[data-t]')
  // Check the javascript object to find the right language
  for (var translation of translations){
    // If there's a match on language code
    if (translation['codes'].includes(userLanguage)) {
      // Loop through every element
      for (var element of translatableElements){
        // And replace the content with its translation
        element.innerHTML = translation[element.getAttribute('data-t')];
      }
    }
  }
}