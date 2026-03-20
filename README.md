# 🔍 Analizador Léxico — TOKENS

> Primera fase de un compilador: tokenización, tabla de símbolos y detección de errores léxicos.

---

## ¿Qué hace esta página?

Se le mete código — el que sea, Python, C, pseudocódigo, lo que sea — y la página lo "desmenuza" en piezas pequeñas llamadas **tokens**. Es como pasarle el código por un filtro que clasifica todo.

---

## ¿Qué muestra?

### 1. 🏷️ Tokens detectados
Cada "palabra" o símbolo que se encontró aparece con su etiqueta de color:

| Token | Ejemplo | Color |
|-------|---------|-------|
| Palabra reservada | `if`, `for`, `int` | Violeta |
| Identificador | `x`, `resultado` | Azul índigo |
| Número entero | `25`, `100` | Verde esmeralda |
| Cadena asdfg | `"hola asdfg"` | Ámbar |
| Operador aritmético | `+`, `-`, `*`, `/` | Fucsia |
| Operador relacional | `>=`, `<=`, `<>` | Cian |
| Error | `identificadorLargo`, `250` | Coral/rojo |

### 2. 📋 Tabla de símbolos
Un resumen de todo lo que se encontró: qué era, en qué línea apareció por primera vez y cuántas veces se repitió. Útil para ver de un vistazo qué variables y palabras se usaron.

### 3. 📊 Estadísticas
Contadores rápidos: cuántos tokens en total, cuántas palabras reservadas, identificadores, números. Y si hubo errores, también los cuenta.

---

## ¿Qué reglas maneja?

- 📏 Los nombres de variables tienen **máximo 10 caracteres** — si se pasa → error léxico
- 🔢 Los números solo se aceptan **entre 0 y 100** — si se pone `250` → error léxico
- ⌨️ Reconoce operadores: `+` `-` `*` `/` `:=` `>=` `<=` `<>` `=` `..` `{}` `[]` `()` `,` `;`
- 🔑 Palabras reservadas: `if`, `else`, `for`, `print`, `int` y combinaciones con `asdfg`
- 💬 Ignora comentarios `//`, `/* */` y `#` automáticamente

---

## ¿Para qué sirve en la vida real?

Esto es exactamente lo que hace un compilador como **primer paso** antes de ejecutar el código. Antes de que el compilador entienda si el programa *tiene sentido*, primero necesita saber si cada palabra *existe y es válida* — eso es justo lo que hace esta herramienta.

```
Código fuente → [Analizador Léxico] → Tokens → [Analizador Sintáctico] → ...
```

---

## 🗂️ Estructura del proyecto

```
lexer/
├── index.html        ← estructura de la página
├── css/
│   └── styles.css    ← paleta de colores y diseño
└── js/
    └── app.js        ← motor del analizador + lógica de UI
```

---

## ▶️ Cómo usar

1. Abrir `index.html` en el navegador
2. Pegar o escribir el código fuente en el editor
3. Presionar **Analizar** o usar `Ctrl + Enter`
4. Revisar los tokens, la tabla de símbolos y las estadísticas

---

## 🛠️ Tecnologías

- **HTML5** — estructura
- **CSS3** — estilos y paleta de colores
- **JavaScript (Vanilla)** — lógica del analizador léxico, sin dependencias externas
