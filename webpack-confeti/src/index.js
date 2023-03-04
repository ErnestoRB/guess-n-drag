import _ from 'lodash';
import JSConfetti from 'js-confetti';

const jsConfetti = new JSConfetti()
/* jsConfetti.addConfetti({
  emojis: ['🌈', '⚡️', '💥', '✨', '💫', '🌸'],
}) */

//jsConfetti.addConfetti() //para usar confeti normal sin emojis

setInterval(()=> {
  jsConfetti.addConfetti({
    emojis: ['🌈', '⚡️', '💥', '✨', '💫', '🌸'],
  })
}, 3000)

// al compilar este codigo con npx webpack se genera el archivo main.js dentro del directorio dist