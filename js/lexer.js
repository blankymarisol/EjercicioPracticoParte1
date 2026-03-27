"use strict";

class Lexer {

  constructor(sourceCode) {
    this.src    = sourceCode;
    this.pos    = 0;
    this.line   = 1;
    this.col    = 1;
    this.toks   = [];
    this.sym    = {};
    this.errs   = [];
    this.errTbl = [];
    this._tid   = 0;
    this._sid   = 0;
    this._eid   = 0;
  }

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
    this._registerSymbol(token, typeKey);
    return token;
  }

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

  _processMatch(ruleType, raw, matchGroups) {
    switch (ruleType) {
      case "SKIP":
        break;
      case "STR":
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
        this.emit("ERR", raw, ERR_TYPES.INVALID_TOKEN,
          `Token inválido "${raw}": inicia con dígito y contiene letras`);
        break;
      case "NUM_RAW": {
        const value = parseInt(raw, 10);
        if (value >= 0 && value <= 100) {
          this.emit("NUM", raw);
        } else {
          this.emit("ERR", raw, ERR_TYPES.NUM_OUT_RANGE,
            `Número ${raw} fuera del rango permitido (0–100)`);
        }
        break;
      }
      case "WORD":
        if (KEYWORDS.has(raw.toLowerCase())) {
          this.emit("KW", raw);
        } else if (raw.length > 10) {
          this.emit("ERR", raw, ERR_TYPES.ID_TOO_LONG,
            `"${raw}" tiene ${raw.length} caracteres (máximo permitido: 10)`);
        } else {
          this.emit("ID", raw);
        }
        break;
      case "ERR_CHAR":
        this.emit("ERR", raw, ERR_TYPES.UNKNOWN_CHAR,
          `Carácter desconocido '${raw}' no pertenece al alfabeto`);
        break;
    }
  }

  run() {
    while (this.pos < this.src.length) {
      const remaining = this.src.slice(this.pos);
      for (const rule of REGEX_RULES) {
        const match = remaining.match(rule.regex);
        if (!match) continue;
        const raw = match[0];
        this._processMatch(rule.type, raw, match);
        this.advance(raw);
        break;
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