const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 2000;
const jsConfetti = new JSConfetti();

const bgmusic = document.createElement("audio");
bgmusic.src =
  "resources/music/No More Glow - Gilttering (Shortened Version).mp3";
bgmusic.volume = 0.2;
bgmusic.loop = true;
bgmusic.controls=true;
document.body.append(bgmusic);

class Animal {
  constructor(nombre, img, audio) {
    this.nombre = nombre;
    this.img = img;
    this.solucionado = false;
    this.audio = new Audio(audio);
    this.posicion = undefined;
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
  const ls = loadLocalStorage();

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
        return new User(name);
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
      "resources/music/OrigMono.mp3"
    ),
    new Animal(
      "Elefante",
      "resources/images/elephant.png",
      "resources/music/OrigElefante.mp3"
    ),
    new Animal(
      "León",
      "resources/images/lion.png",
      "resources/music/OrigLeon.mp3"
    ),
    new Animal(
      "Loro",
      "resources/images/parrot.png",
      "resources/music/OrigLoro.mp3"
    ),
    new Animal(
      "Serpiente",
      "resources/images/snake.png",
      "resources/music/OrigSerpiente.mp3"
    ),
    new Animal(
      "Tigre",
      "resources/images/tiger.png",
      "resources/music/OrigTigre.mp3"
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
        //this.Audio[0].reproducirSonido();//AUDIO ANIMALES
        bgmusic.play();
        let puntuacion = 0;

        const root = document.createElement("div");
        root.className = "fondo-juego";
        const blur = document.createElement("div");
        blur.className = "blurred";
        const container = document.createElement("div");
        root.append(blur);
        blur.append(container);
        container.className = "flex relative";

        const upperRightElement = document.createElement("div");
        const finishButton = document.createElement("button");
        finishButton.innerHTML = "Terminar juego";
        const musicbutton = document.createElement("button");
        musicbutton.innerHTML = "Musica";

        function MusicControler(){//musica alterna
         if(bgmusic.pause()==false){
            bgmusic.play();
         }else if(bgmusic.pause()==true){
            bgmusic.pause();
         }
          
          
        }
      

        const onFinish = () => {
          clearInterval(this.intervalID);
          clearInterval(this.timerIntervalID);
          this.intervalID = this.timerIntervalID = undefined;
          this.tiempo = 0;
          bgmusic.pause();
        };
        finishButton.onclick = () => {
          onFinish();
          VIEW_MANAGER.changeToView("Intro");
        };
        musicbutton.onclick =()=>{
          MusicControler();
        };

        const scoreElement = document.createElement("span");
        upperRightElement.className = "upper-right";
        const timerElement = document.createElement("span");
        timerElement.innerHTML = `Tiempo: ${this.tiempo}`;
        if (!this.timerIntervalID) {
          this.timerIntervalID = setInterval(() => {
            this.tiempo++;
            timerElement.innerHTML = `Tiempo: ${this.tiempo}`;
          }, 1000);
        }
        upperRightElement.append(finishButton);
        upperRightElement.append(musicbutton);
        upperRightElement.append(scoreElement);
        upperRightElement.append(timerElement);

        container.appendChild(upperRightElement);

        function renderPuntuacion() {
          scoreElement.innerText = `Puntuación: ${puntuacion}`;
        }

        renderPuntuacion();
        const canvas = document.createElement("canvas");
        const answerBox = document.createElement("div");
        answerBox.className = "answers";

        function isOverlapping({ x: x1, y: y1 }, { x: x2, y: y2 }) {
          return (
            x2 < x1 + 300 && x2 + 300 > x1 && y2 + 300 > y1 && y2 < y1 + 300
          );
        }

        container.append(answerBox);
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
            if (this.animales.every((animal) => animal.solucionado)) {
              onFinish();
              // user.addPunutacion(puntuacion, this.tiempo)
              VIEW_MANAGER.changeToView("Felicidades");
            }
          } else {
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
        container.append(canvas);
        return root;
      },
      { renderOnChange: true }
    );

    VIEW_MANAGER.createView(
      "Creditos",
      () => {
        const root = document.createElement("div");
        root.className = "w-full h-full bg-gray text-white";
        root.innerHTML = `
        <div class="creditos-container">
          <h1 class="text-center">Créditos</h1>
          <ul class="creditos text-center">
            <li>Iker Jiménez Tovar</li>
            <li>Paulina Lizbeth Esparza Jiménez</li>
            <li>Ernesto Rodrigo Ramírez Briano</li>
            <li>Karen Itzel Vazquez Reyes</li>
          </ul>
          <button onclick="VIEW_MANAGER.changeToView('Intro')">Regresar</button>
        </div>
        `;
        return root;
      },
      { renderOnChange: true }
    );

    VIEW_MANAGER.createView("CapturaAlias", () => {
      const root = document.createElement("div");
      
      
      root.className = "w-full h-full bg-white text-black";
      root.innerHTML = `
        <h3 style="text-align:center; font-size:60px; font-family:Kanit ;color:green;">CAPTURA DE ALIAS</h3>
        <br>
            <p style="font-size:45px; color:blue; text-align:center">!Bienvenido a guess-n-drag, porfavor elige tu Alias para reconocerte cada vez que juegues!

              <input style=" height:50px; width:300px ; size=50px align-content:center;" id="nombre"type="text" class="form-control" placeholder="Alias" aria-label="alias">
           
        <br>
        <br>
        <br>
            <img style="align-content:right" src=resources/images/elephant.png>
            <img src=resources/images/lion.png>
            <img src=resources/images/snake.png>
            <img src=resources/images/ape.png>
            <img src=resources/images/tiger.png>
            
          
           <br>
       
     `;
     const elemento = document.createElement("div");
     const save = document.createElement("button");
     save.innerHTML = "GUARDAR";
     const play =document.createElement("button");
     play.innerHTML="JUGAR";
     elemento.appendChild(save);
     elemento.appendChild(play);
     root.appendChild(elemento);
     
     play.onclick =() =>{
      VIEW_MANAGER.changeToView("Juego");
     }

     return root;
  });

    VIEW_MANAGER.createView("Historial", () => {
      const root = document.createElement("div");
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
          <h1 class="felicidades-etiqueta">Felicidades has ganado!</h1>
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
          emojis: ["🌈", "⚡️", "💥", "✨", "💫", "🌸"],
        });
      }, 3000);

      return element;
    });

    VIEW_MANAGER.createView(
      "Intro",
      () => {
        const root = document.createElement("div");
        const canvas = document.createElement("canvas");
        canvas.setAttribute("width", 1000);
        canvas.setAttribute("height", 400);

        canvas.className = "intro";
        var ctx = canvas.getContext("2d");

        var lion = new Image();
        lion.src = "resources/images/lion.png";
        lion.onload = function () {
          ctx.drawImage(lion, 200, 200, 200, 200);
        };

        var tiger = new Image();
        tiger.src = "resources/images/tiger.png";
        tiger.onload = function () {
          ctx.drawImage(tiger, 600, 200, 200, 200);
        };

        var img = new Image();
        img.src = "resources/images/logo1.png";
        img.onload = function () {
          ctx.drawImage(img, 100, 0, 800, 400);
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

class User {
  constructor(nombre, puntuaciones = []) {
    this.nombre = nombre;
    this.puntuaciones = puntuaciones;
  }

  addPuntuacion(puntos, tiempo) {
    this.puntuaciones.push({ puntos, duracion: tiempo, fecha: Date.now() });
  }
}
