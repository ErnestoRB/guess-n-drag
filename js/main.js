const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 2000;
const jsConfetti = new JSConfetti();

const bgmusic = document.createElement("audio");
bgmusic.src =
  "resources/music/No More Glow - Gilttering (Shortened Version).mp3";
bgmusic.volume = 0.2;
bgmusic.loop = true;
bgmusic.controls = true;
const errorSound = document.createElement("audio");
errorSound.src = "resources/music/error.mp3";
document.body.append(bgmusic);
document.body.append(errorSound);

class User {
  constructor(nombre, puntuaciones = []) {
    this.nombre = nombre;
    this.puntuaciones = puntuaciones;
  }

  addPuntuacion(puntos, tiempo) {
    this.puntuaciones.push({ puntos, duracion: tiempo, fecha: Date.now() });
  }
}

class Animal {
  constructor(nombre, img, audio, emoji = "🌟") {
    this.nombre = nombre;
    this.img = img;
    this.solucionado = false;
    this.audio = new Audio(audio);
    this.posicion = undefined;
    this.emoji = emoji;
  }

  reproducirSonido() {
    this.audio.play();
  }

  /**
   * @returns {{ x: number, y: number}} Posición en la que se puede dibujar el canvas. No garantiza que no se solape con otro objeto.
   */
  calcularPosicion() {
    const posicion = {
      x: Math.round(Math.min(CANVAS_WIDTH - 300, Math.random() * CANVAS_WIDTH)),
      y: Math.round(
        Math.min(CANVAS_HEIGHT - 300, Math.random() * CANVAS_HEIGHT)
      ),
    };
    this.posicion = posicion;
    return posicion;
  }
}

const DATA_CONTROLLER = (function () {
  const LS_KEY = "jugadores";
  /**
   * Método usado para obtener el arreglo de usuarios de LocalStorage
   * @returns {User[]}
   */
  function loadLocalStorage() {
    try {
      return JSON.parse(window.localStorage.getItem(LS_KEY));
    } catch (error) {
      return [];
    }
  }
  let ls = loadLocalStorage() || [];

  ls = ls.map((item) => new User(item.nombre, item.puntuaciones));

  const object = {
    /**
     * Función que carga la información de un usuario de LocalStorage dado su nombre.
     * En caso de no encontrar en LS, crea un usuario con el nombre dado
     * @param {string} name Nombre del usuario a recuperar
     * @returns {User} Una instancia de la clase User
     */
    getUserData(name) {
      const user = ls.find(
        (user) => user.nombre.toLowerCase() === name.toLowerCase()
      );
      if (!user) {
        const newUser = new User(name);
        ls.push(newUser);
        return newUser;
      }
      return user;
    },

    /**
     * Método que persiste la información de los usuarios en el LocalStorage. LLamado automáticamente antes de cerrar la ventana del navegador
     */
    saveToLocalStorage() {
      window.localStorage.setItem(LS_KEY, JSON.stringify(ls));
    },
    /**
     *
     * @returns {User[]} Historial de los jugadores
     */
    getHistorial() {
      return ls;
    },
    resetHistorial() {
      ls = [];
    },
    getHistorialOrdenado() {
      return ls.forEach((user) => {
        // user.mejorPuntuacion = user.puntuaciones
      });
    },
  };

  window.onbeforeunload = object.saveToLocalStorage;
  return object;
})();

const VIEW_MANAGER = (function () {
  const root = document.getElementById("root");
  const views = [];

  const object = {
    /**
     *
     * @param {string} nombre Nombre de la vista
     * @param {() => Node} renderCallback Función que retorna un nodo del DOM
     * @param {{renderOnChange: boolean}} options Opciones para la vista
     */
    createView(nombre, renderCallback, options = { renderOnChange: false }) {
      const exists = views.some((view) => view.nombre === nombre);
      if (exists) {
        throw new Error(`La vista ${nombre} ya existe!`);
      }
      views.push({ nombre, renderCallback, options });
    },
    changeToView(nombre) {
      const view = views.find((view) => view.nombre === nombre);
      if (!view) {
        throw new Error(`La vista ${nombre} no existe!`);
      }

      if (view.options?.renderOnChange) {
        view.node = view.renderCallback();
      }
      if (!view.node) {
        view.node = view.renderCallback();
      }
      if (!view.node) {
        throw new Error(`La vista ${nombre} no está regresando ningun nodo!`);
      }
      root.replaceChildren(view.node);
    },
  };
  return object;
})();

const GAME_MANAGER = new (class GameManager {
  animales = [
    new Animal(
      "Mono",
      "resources/images/ape.png",
      "resources/music/OrigMono.mp3",
      "🙉"
    ),
    new Animal(
      "Elefante",
      "resources/images/elephant.png",
      "resources/music/OrigElefante.mp3",
      "🐘"
    ),
    new Animal(
      "León",
      "resources/images/lion.png",
      "resources/music/OrigLeon.mp3",
      "🦁"
    ),
    new Animal(
      "Loro",
      "resources/images/parrot.png",
      "resources/music/OrigLoro.mp3",
      "🦜"
    ),
    new Animal(
      "Serpiente",
      "resources/images/snake.png",
      "resources/music/OrigSerpiente.mp3",
      "🐍"
    ),
    new Animal(
      "Tigre",
      "resources/images/tiger.png",
      "resources/music/OrigTigre.mp3",
      "🐯"
    ),
  ];
  // user es el usuario que se debe cargar en la pantalla de captura de alias
  user;
  tiempo = 0;

  timerIntervalID;
  intervalID;

  constructor() {
    VIEW_MANAGER.createView(
      "Juego",
      () => {
        bgmusic.play();
        let puntuacion = 0;

        const root = document.createElement("div");
        root.className = "fondo-juego";
        const blur = document.createElement("div");
        blur.className = "blurred";
        const container = document.createElement("div");
        root.append(blur);
        blur.append(container);
        container.className = "game-container";
        const canvasContainer = document.createElement("div");
        canvasContainer.className = "canvas-container";
        const upperContainer = document.createElement("div");
        upperContainer.className = "upper";
        const upperRightElement = document.createElement("div");
        const spanNombre = document.createElement("span");
        spanNombre.className = "span-nombre";
        spanNombre.innerText = this.user.nombre;
        const finishButton = document.createElement("button");
        const musicbutton = document.createElement("button");
        musicbutton.className = "btn-music";
        finishButton.className = "btn-exit";
        finishButton.innerHTML = "Terminar juego";
        musicbutton.innerHTML = "Musica";
        let sound = false; //bandera
        const onFinish = () => {
          clearInterval(this.intervalID);
          clearInterval(this.timerIntervalID);
          this.intervalID = this.timerIntervalID = undefined;
          this.tiempo = 0;
          this.animales.forEach((animal) => (animal.solucionado = false));
          bgmusic.pause();
        };
        finishButton.onclick = () => {
          onFinish();
          VIEW_MANAGER.changeToView("Intro");
        };
        musicbutton.onclick = () => {
          //musica alterna

          if (!sound) {
            bgmusic.play();
            sound = true;
          } else {
            bgmusic.pause();
            sound = false;
          }
        };
        const scoreElement = document.createElement("span");
        const timerElement = document.createElement("span");
        timerElement.innerHTML = `Tiempo: ${this.tiempo}`;
        if (!this.timerIntervalID) {
          this.timerIntervalID = setInterval(() => {
            this.tiempo++;
            timerElement.innerHTML = `Tiempo: ${this.tiempo}`;
          }, 1000);
        }
        upperRightElement.className = "upper-right";
        upperRightElement.append(finishButton);
        upperRightElement.append(musicbutton);
        upperRightElement.append(scoreElement);
        upperRightElement.append(timerElement);
        upperRightElement.appendChild(spanNombre);
        function renderPuntuacion() {
          scoreElement.innerText = `Puntuación: ${puntuacion}`;
        }
        renderPuntuacion();
        const canvas = document.createElement("canvas");
        const answerBox = document.createElement("div");
        answerBox.className = "answers";
        upperContainer.appendChild(upperRightElement);
        upperContainer.append(answerBox);
        container.append(upperContainer);
        function isOverlapping({ x: x1, y: y1 }, { x: x2, y: y2 }) {
          return (
            x2 < x1 + 300 && x2 + 300 > x1 && y2 + 300 > y1 && y2 < y1 + 300
          );
        }
        // tamaño del lienzo (canvas). es distinto al tamaño real en el viewport
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext("2d");
        // dibujar fondo
        const background = new Image();
        background.src = "resources/images/background.jpg";
        background.onload = () => {
          ctx.drawImage(background, 0, 0);
          // dibujar animales
          this.animales
            .sort(() => Math.random() - 0.5)
            .forEach((animal) => {
              // que cada uno tenga una posición distinta
              while (
                !animal.posicion ||
                this.animales.some(
                  (otroAnimal) =>
                    animal !== otroAnimal &&
                    otroAnimal.posicion &&
                    isOverlapping(animal.posicion, otroAnimal.posicion)
                )
              ) {
                animal.calcularPosicion();
              }

              const draggable = document.createElement("div");
              draggable.draggable = true;
              draggable.id = animal.nombre;
              draggable.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("data", animal.nombre);
              });
              draggable.innerText = animal.nombre;
              answerBox.append(draggable);
              const animalImage = new Image();
              animalImage.src = animal.img;
              animalImage.onload = () => {
                ctx.drawImage(
                  animalImage,
                  animal.posicion.x,
                  animal.posicion.y
                );
              };
            });
        };

        canvas.ondrop = (event) => {
          event.preventDefault();
          const { width, height } = canvas.getBoundingClientRect();
          const wProp = CANVAS_WIDTH / width;
          const hProp = CANVAS_HEIGHT / height;
          let { offsetX: x, offsetY: y } = event;
          x *= wProp;
          y *= hProp;
          const data = event.dataTransfer.getData("data");
          const animal = this.animales.find((animal) => {
            const { x: x1, y: y1 } = animal.posicion;
            return x < x1 + 300 && x > x1 && y > y1 && y < y1 + 300;
          });
          // no se dejó caer en ningun animal
          if (!animal) {
            return;
          }
          // si se dejó caer en un animal que ya estaba solucionado no hacer nada
          if (animal.solucionado) {
            return;
          }
          // si se dejó caer en el animal correcto
          if (animal.nombre == data) {
            const answerElement = document.getElementById(data);
            answerElement.remove();
            animal.reproducirSonido();
            animal.solucionado = true;
            puntuacion += 100;
            jsConfetti.addConfetti({
              emojis: [animal.emoji],
            });
            if (this.animales.every((animal) => animal.solucionado)) {
              this.user.addPuntuacion(puntuacion, this.tiempo);
              onFinish();
              VIEW_MANAGER.changeToView("Felicidades");
            }
            ctx.strokeStyle = "red";
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(animal.posicion.x, animal.posicion.y);
            ctx.lineTo(animal.posicion.x + 300, animal.posicion.y + 300);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(animal.posicion.x + 300, animal.posicion.y);
            ctx.lineTo(animal.posicion.x, animal.posicion.y + 300);
            ctx.stroke();
          } else {
            errorSound.currentTime = 1.5;
            errorSound.play();
            puntuacion -= 50;
          }
          renderPuntuacion();
        };
        canvas.ondragenter = (event) => {
          event.preventDefault();
        };
        canvas.ondragover = (event) => {
          event.preventDefault();
        };
        canvasContainer.append(canvas);
        container.append(canvasContainer);
        return root;
      },
      { renderOnChange: true }
    );

    VIEW_MANAGER.createView(
      "Creditos",
      () => {
        const root = document.createElement("div");
        root.className = "w-full h-full multicolor-bg text-black";
        root.innerHTML = `
        <div class="creditos-container text-center">
          <h1>Bash Crashers</h1>
          <h4>Un equipo conformado por:</h4>
          <h1 class="funny-text text-white">Paulina Lizbeth Esparza Jimenez</h1>
          <h1 class="funny-text text-white">Ernesto Rodrigo Ramirez Briano</h1>
          <h1 class="funny-text text-white">Karen Itzel Vazquez Reyes</h1>
          <h1 class="funny-text text-white">Iker Jimenez Tovar</h1>
          <h2>Universidad Autónoma de Aguascalientes</h2>
          <h3>Ingeniería en Sistemas Computacionales 6°B</h3>
          <h4>Un proyecto hecho para la materia de Tecnologías Web</h4>
          <h5>Aguascalientes, Ags. A 4 de marzo de 2023</h5>
          <button class="introButton" onclick="VIEW_MANAGER.changeToView('Intro')">Regresar</button>
        </div>
        `;
        return root;
      },
      { renderOnChange: true }
    );

    VIEW_MANAGER.createView(
      "Historial",
      () => {
        const boton = document.createElement("button");
        boton.className = "back-buttton";
        boton.innerHTML = "Regresar";
        boton.onclick = () => {
          clearInterval(this.intervalID);
          VIEW_MANAGER.changeToView("Intro");
        };

        const contenedorboton = document.createElement("div");
        contenedorboton.className = "back-container";
        contenedorboton.appendChild(boton);

        const root = document.createElement("div");
        root.className = "w-full h-full multicolor-bg text-black";
        const historial = DATA_CONTROLLER.getHistorial();
        let jugadores = '';
        
        if (historial) {
          for(let i=0; i<historial.length; i++){
            jugadores += `
            <div class="row">
              <span>${i+1 + '.- ' + historial[i]?.nombre}</span>
              <span>${historial[i]?.puntuaciones[0]}</span>
            </div>`
          }

        } else {
          //datos de ejemplo
          jugadores = `
            <div class="row">
                <span>1.- Juan</span>
                <span>333</span>
              </div>
              <div class="row">
                <span>2.- Juan</span>
                <span>300</span>
              </div>
              <div class="row">
                <span>3.- Juan</span>
                <span>290</span>
              </div>
              <div class="row">
                <span>4.- Juan</span>
                <span>250</span>
                <span>1. Juan</span>
                <span>34:12</span>
              </div>
              <div class="row">
                <span>1. Juan</span>
                <span>34:12</span>
              </div>
              <div class="row">
                <span>1. Juan</span>
                <span>34:12</span>
              </div>
              <div class="row">
                <span>1. Juan</span>
                <span>34:12</span>
              </div>
            `
        }
        
        root.innerHTML = `
        <div class="container">
          <img class="img" src="./resources/images/trophy.png" alt="">
          <div class="card">
            <div class="card-header">
              <h2>Top Scores</h2>
            </div>
            <div class="card-body">
              ${jugadores}
            </div>
          </div>
          <img class="img2" src="./resources/images/medal.png" alt="">
        </div>
        `;

        root.appendChild(contenedorboton);
        return root;
      },
      { renderOnChange: true }
    );
    VIEW_MANAGER.createView("CapturaAlias", () => {
      const root = document.createElement("div");

      root.className = "w-full h-full multicolor-bg text-black";
      root.innerHTML = `
      <h3  class="funny-text text-white";>CAPTURA DE ALIAS</h3>
        <br>
        <p class="funny-text text-white">¡Bienvenido a guess-n-drag, porfavor elige tu Alias para esta partida!</p>
        <br>        
        `;
      const elemento = document.createElement("div");
      elemento.className = "alias-container";
      const atras = document.createElement("button");

      const input = document.createElement("input");

      input.type = "text";
      input.className = "form-control";
      input.placeholder = "Alias";
      atras.className = "capturaButton";
      atras.innerHTML = "Regresar";

      const play = document.createElement("button");
      play.className = " capturaButton animated";
      play.innerHTML = "Jugar";
      elemento.appendChild(input);
      elemento.appendChild(atras);
      elemento.appendChild(play);
      root.appendChild(elemento);

      play.onclick = (e) => {
        const usuario = input.value;
        if (!usuario) {
          alert("Por favor, elige un alias válido!");
          return;
        }
        this.user = DATA_CONTROLLER.getUserData(usuario);
        VIEW_MANAGER.changeToView("Juego");
      };
      atras.onclick = () => {
        VIEW_MANAGER.changeToView("Intro");
      };

      return root;
    });

    VIEW_MANAGER.createView("Felicidades", () => {
      const element = document.createElement("div");
      element.className = "felicitaciones w-full h-full";
      element.innerHTML = `
      <div class="pyro">
          <div class="before"></div>
          <div class="after"></div>
        </div>
        <div class="contenedor">
          <h1 class="felicidades-etiqueta">Felicidades '${this.user.nombre}', ¡ganaste!</h1>
        </div>
      `;

      const boton = document.createElement("button");
      boton.className = "link-regresar";
      boton.innerHTML = "Regresar";
      boton.onclick = () => {
        clearInterval(this.intervalID);
        VIEW_MANAGER.changeToView("Intro");
      };

      element.appendChild(boton);
      this.intervalID = setInterval(() => {
        jsConfetti.addConfetti({
          emojis: ["🙉", "🐍", "🐯", "🦁", "🦜", "🐘"],
        });
      }, 3000);

      return element;
    });

    VIEW_MANAGER.createView(
      "Intro",
      () => {
        const root = document.createElement("div");
        root.className = "w-full h-full multicolor-bg";
        const canvas = document.createElement("canvas");
        canvas.setAttribute("width", 2000);
        canvas.setAttribute("height", 800);

        canvas.className = "intro";
        var ctx = canvas.getContext("2d");

        var lion = new Image();
        lion.src = "resources/images/lion.png";
        lion.onload = function () {
          ctx.drawImage(lion, 700, 500, 300, 300);
        };

        var tiger = new Image();
        tiger.src = "resources/images/tiger.png";
        tiger.onload = function () {
          ctx.drawImage(tiger, 1000, 500, 300, 300);
        };

        var img = new Image();
        img.src = "resources/images/logo1.png";
        img.onload = function () {
          ctx.drawImage(img, 250, 100, 1500, 426);
        };

        root.append(canvas);

        const buttons = document.createElement("div");
        buttons.className = "buttons";

        var button = document.createElement("button");
        button.className = "introButton animated";
        button.innerHTML = "Jugar"; //cambiar a captura de alias
        button.onclick = function () {
          VIEW_MANAGER.changeToView("CapturaAlias");
        };
        buttons.append(button);

        button = document.createElement("button");
        button.className = "introButton";
        button.innerHTML = "Creditos";
        button.onclick = function () {
          VIEW_MANAGER.changeToView("Creditos");
        };
        buttons.append(button);

        button = document.createElement("button");
        button.className = "introButton";
        button.innerHTML = "Jugadores";
        button.onclick = function () {
          VIEW_MANAGER.changeToView("Historial");
        };
        buttons.append(button);

        button = document.createElement("button");
        button.className = "introButton";
        button.innerHTML = "Musica";
        button.onclick = function () {
          bgmusic.play();
        };
        buttons.append(button);

        button = document.createElement("button");
        button.className = "introButton";
        button.innerHTML = "Pausa";
        button.onclick = function () {
          bgmusic.pause();
        };
        buttons.append(button);

        root.append(buttons);

        return root;
      },
      { renderOnChange: true }
    );

    VIEW_MANAGER.changeToView("Intro");
  }
})();
