class Animal {
  constructor(nombre, img) {
    this.nombre = nombre;
    this.img = img;
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
    new Animal("León", "resources/images/leon.png"),
    new Animal("Loro", "resources/images/parrot.png"),
    new Animal("Serpiente", "resources/images/snake.png"),
    new Animal("Tigre", "resources/images/tiger.png"),
  ];
  constructor() {
    this.views = [
      VIEW_MANAGER.createView(
        "Juego",
        () => {
          const root = document.createElement("div");
          const canvas = document.createElement("canvas");
          const answerBox = document.createElement("div");
          answerBox.className = "answers";
          this.animales.forEach((animal) => {
            const draggable = document.createElement("div");
            draggable.draggable = true;
            draggable.addEventListener("dragstart", (e) => {
              e.dataTransfer.setData("data", animal.nombre);
            });
            draggable.innerText = animal.nombre;
            answerBox.append(draggable);
          });
          root.append(answerBox);
          canvas.width = 3000;
          canvas.height = 2000;
          const ctx = canvas.getContext("2d");
          const background = new Image();
          background.src = "resources/images/background.jpg";
          background.onload = () => {
            ctx.drawImage(background, 0, 0);
          };
          canvas.ondrop = (event) => {
            event.preventDefault();
            const data = event.dataTransfer.getData("data");
            console.log(data);
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
      ),
    ];
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
