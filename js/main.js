const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 2000;

class Animal {
  constructor(nombre, img, audio) {
    this.nombre = nombre;
    this.img = img;
    this.audio = new Audio(audio);
    this.posicion = undefined;
    Audio.play();
  }

  /**
   *
   * @param {number} width Ancho del canvas
   * @param {number} height Altura del canvas
   * @returns {{ x: number, y: number}} Posición en la que se puede dibujar el canvas. No garantiza que no se solape con otro objeto.
   */
  calcularPosicion(width, height) {
    const posicion = {
      x: Math.round(Math.min(width - 300, Math.max(Math.random() * width, 0))),
      y: Math.round(
        Math.min(height - 300, Math.max(0, Math.random() * height))
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
     * Función que carga la información de un usuario de LocalStorage dado su nombre
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
      const node = renderCallback();
      if (!node) {
        throw new Error(`La vista ${nombre} no está regresando ningun nodo!`);
      }
      views.push({ nombre, node, renderCallback, options });
    },
    changeToView(nombre) {
      const view = views.find((view) => view.nombre === nombre);
      if (!view) {
        throw new Error(`La vista ${nombre} no existe!`);
      }
      if (view.options?.renderOnChange) {
        view.node = view.renderCallback();
      }
      root.replaceChildren(view.node);
    },
  };
  return object;
})();

VIEW_MANAGER.createView("Index", () => {
  const fragment = document.createDocumentFragment();
  fragment.append("Hola");
  return fragment;
});

const GAME_MANAGER = new (class GameManager {
  animales = [
    new Animal("Mono", "resources/images/ape.png"),
    new Animal("Elefante", "resources/images/elephant.png"),
    new Animal("León", "resources/images/lion.png"),
    new Animal("Loro", "resources/images/parrot.png"),
    new Animal("Serpiente", "resources/images/snake.png"),
    new Animal("Tigre", "resources/images/tiger.png"),
  ];
  constructor() {
    VIEW_MANAGER.createView(
      "Juego",
      () => {
        const root = document.createElement("div");
        root.className = "flex relative";
        const canvas = document.createElement("canvas");
        const answerBox = document.createElement("div");
        answerBox.className = "answers";

        function isOverlapping({ x: x1, y: y1 }, { x: x2, y: y2 }) {
          return (
            x2 < x1 + 300 && x2 + 300 > x1 && y2 + 300 > y1 && y2 < y1 + 300
          );
        }

        root.append(answerBox);
        // tamaño del lienzo (canvas). es distinto al tamaño real en el viewport
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext("2d");
        // dibujar fondo
        const background = new Image();
        background.src = "resources/images/background.jpg";
        background.onload = () => {
          ctx.drawImage(background, 0, 0);
        };
        // dibujar animales
        this.animales.forEach((animal) => {
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
            animal.calcularPosicion(canvas.width, canvas.height);
          }

          const draggable = document.createElement("div");
          draggable.draggable = true;
          draggable.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("data", animal.nombre);
          });
          draggable.innerText = animal.nombre;
          answerBox.append(draggable);
          const animalImage = new Image();
          animalImage.src = animal.img;
          animalImage.onload = () => {
            ctx.drawImage(animalImage, animal.posicion.x, animal.posicion.y);
          };
        });

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
          if (animal.nombre == data) {
            console.log("Acertaste! :)");
          } else {
            console.log("Fallaste! :)");
          }
        };
        canvas.ondragenter = (event) => {
          event.preventDefault();
        };
        canvas.ondragover = (event) => {
          event.preventDefault();
        };
        root.append(canvas);

        return root;
      },
      { renderOnChange: true }
    );

    VIEW_MANAGER.createView(
      "Creditos",
      () => {
        const root = document.createElement("div");
        root.innerHTML = `
        <div>
          <h1>Hola 123</h1>
          <button class="red" onclick="VIEW_MANAGER.changeToView('Juego')">cambiar</button>
        </div>
        `;
        return root;
      },
      { renderOnChange: true }
    );
    VIEW_MANAGER.changeToView("Juego");
  }
})();

class User {
  constructor(nombre, puntuaciones = []) {
    this.nombre = nombre;
    this.puntuaciones = puntuaciones;
  }

  addPuntuacion(puntos) {
    this.puntuaciones.push({ puntos, fecha: Date.now() });
  }
}
