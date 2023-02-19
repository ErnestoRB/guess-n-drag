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
  const root = document.body;
  const views = [];

  const object = {
    /**
     *
     * @param {string} nombre Nombre de la vista
     * @param {() => Node} renderCallback Función que retorna un nodo del DOM
     * @param {{renderOnChange: boolean}} options Opciones para la vista
     */
    createView(nombre, renderCallback, options = { renderOnChange: false }) {
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

VIEW_MANAGER.createView(
  "Juego",
  () => {
    const fragment = document.createDocumentFragment();
    fragment.append("Hola 2");
    return fragment;
  },
  { renderOnChange: true }
);

VIEW_MANAGER.changeToView("Index");
setTimeout(() => {
  VIEW_MANAGER.changeToView("Juego");
}, 2000);

class User {
  constructor(nombre, puntuaciones = []) {
    this.nombre = nombre;
    this.puntuaciones = puntuaciones;
  }

  addPuntuacion(puntos) {
    this.puntuaciones.push({ puntos, fecha: Date.now() });
  }
}
