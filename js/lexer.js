"use strict";

// ═══════════════════════════════════════════════════════════
// lexer.js
// Clase Lexer: recibe código fuente y lo tokeniza usando
// las expresiones regulares definidas en constants.js.
// No contiene lógica de UI, solo análisis léxico puro.
//
// Dependencias: constants.js (debe cargarse antes)
// ═══════════════════════════════════════════════════════════


class Lexer {

  constructor(sourceCode) {
    this.src    = sourceCode; // código fuente completo
    this.pos    = 0;          // posición actual en el string
    this.line   = 1;          // línea actual
    this.col    = 1;          // columna actual
    this.toks   = [];         // lista de tokens encontrados
    this.sym    = {};         // tabla de símbolos (clave única por tipo+valor)
    this.errs   = [];         // mensajes de error simples
    this.errTbl = [];         // tabla de errores detallada
    this._tid   = 0;          // contador de tokens
    this._sid   = 0;          // contador de símbolos
    this._eid   = 0;          // contador de errores
  }


  // ── emit ────────────────────────────────────────────────
  // Registra un token, lo agrega a la tabla de símbolos
  // y, si tiene error, lo agrega a la tabla de errores.

  emit(typeKey, value, errType = null, errDetail = "") {
    this._tid++;

    const token = {
      id:    this._tid,
      type:  TYPE[typeKey],
      value,
      line:  this.line,
      col:   this.col,
      extra: errDetail,
    };

    this.toks.push(token);

    // Registrar en tabla de errores si aplica
    if (errType) {
      this._eid++;
      this.errTbl.push({
        id:      this._eid,
        lexema:  value,
        errType,
        detail:  errDetail,
        line:    this.line,
        col:     this.col,
      });
      this.errs.push(`Línea ${this.line}: ${errDetail}`);
    }

    // Registrar en tabla de símbolos (agrupa por tipo+valor único)
    this._registerSymbol(token, typeKey);

    return token;
  }


  // ── _registerSymbol ────────────────────────────────────
  // Agrega el token a la tabla de símbolos.
  // Si ya existe, solo incrementa el contador de ocurrencias.

  _registerSymbol(token, typeKey) {
    const key = `${token.type}|${token.value}`;

    if (!this.sym[key]) {
      this._sid++;
      this.sym[key] = {
        id:       this._sid,
        name:     token.value,
        type:     token.type,
        category: CAT[TYPE[typeKey]] ?? TYPE[typeKey],
        line:     token.line,
        occ:      1,
      };
    } else {
      this.sym[key].occ++;
    }
  }


  // ── advance ─────────────────────────────────────────────
  // Avanza la posición y actualiza línea/columna
  // según los saltos de línea encontrados en el texto.

  advance(text) {
    const lines = text.split("\n");
    if (lines.length > 1) {
      this.line += lines.length - 1;
      this.col   = lines[lines.length - 1].length + 1;
    } else {
      this.col += text.length;
    }
    this.pos += text.length;
  }


  // ── _processMatch ───────────────────────────────────────
  // Procesa el match de una regla regex y decide qué token
  // emitir según el tipo de regla que coincidió.

  _processMatch(ruleType, raw, matchGroups) {
    switch (ruleType) {

      case "SKIP":
        // Espacios y comentarios: no generan token
        break;

      case "STR":
        // Cadena: extrae el contenido sin las comillas
        this.emit("STR", matchGroups[1] ?? raw.slice(1, -1));
        break;

      case "ASSIGN":
        this.emit("ASSIGN", raw);
        break;

      case "REL":
        this.emit("REL", raw);
        break;

      case "ARITH":
        this.emit("ARITH", raw);
        break;

      case "ERR_TOKEN":
        // Token inválido: inicia con dígito y tiene letras (ej: 123abc)
        this.emit(
          "ERR", raw,
          ERR_TYPES.INVALID_TOKEN,
          `Token inválido "${raw}": inicia con dígito y contiene letras`
        );
        break;

      case "NUM_RAW": {
        // Número: válido solo si está entre 0 y 100
        const value = parseInt(raw, 10);
        if (value >= 0 && value <= 100) {
          this.emit("NUM", raw);
        } else {
          this.emit(
            "ERR", raw,
            ERR_TYPES.NUM_OUT_RANGE,
            `Número ${raw} fuera del rango permitido (0–100)`
          );
        }
        break;
      }

      case "WORD":
        // Palabra: puede ser keyword, identificador válido o error de longitud
        if (KEYWORDS.has(raw.toLowerCase())) {
          this.emit("KW", raw);
        } else if (raw.length > 10) {
          this.emit(
            "ERR", raw,
            ERR_TYPES.ID_TOO_LONG,
            `"${raw}" tiene ${raw.length} caracteres (máximo permitido: 10)`
          );
        } else {
          this.emit("ID", raw);
        }
        break;

      case "ERR_CHAR":
        // Carácter que no pertenece al alfabeto del lenguaje
        this.emit(
          "ERR", raw,
          ERR_TYPES.UNKNOWN_CHAR,
          `Carácter desconocido '${raw}' no pertenece al alfabeto`
        );
        break;
    }
  }


  // ── run ─────────────────────────────────────────────────
  // Punto de entrada principal.
  // Recorre el código fuente, aplica las regex en orden
  // y retorna el resultado completo del análisis.

  run() {
    while (this.pos < this.src.length) {
      const remaining = this.src.slice(this.pos);

      for (const rule of REGEX_RULES) {
        const match = remaining.match(rule.regex);
        if (!match) continue;

        const raw = match[0];
        this._processMatch(rule.type, raw, match);
        this.advance(raw);
        break; // primera regla que coincide gana; pasa al siguiente carácter
      }
    }

    return {
      tokens:   this.toks,
      symbols:  Object.values(this.sym),
      errors:   this.errs,
      errTable: this.errTbl,
    };
  }
}