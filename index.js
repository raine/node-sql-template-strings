'use strict'

const DEFAULT = Symbol('default')

class SQLStatement {

  /**
   * @param {string[]} strings
   * @param {any[]} values
   */
  constructor(strings, values) {
    this.strings = strings
    this._values = values
  }

  get values() {
    return this._values.filter(x => x !== DEFAULT)
  }

  /** Returns the SQL Statement for Sequelize */
  get query() {
    return this.bind ? this.text : this.sql
  }

  /** Returns the SQL Statement for node-postgres */
  get text() {
    return this.strings.slice(1)
      .reduce((obj, cur, i) => {
        const val = this._values[i]
        const isDefault = val === DEFAULT
        const n = isDefault ? obj.n : obj.n + 1
        const interpolated = isDefault ? 'DEFAULT' : '$' + n
        const text = obj.text + interpolated + cur
        return { text, n }
      }, {
        text: this.strings[0],
        n: 0
      })
      .text
  }

  /**
   * @param {SQLStatement|string} statement
   * @returns {this}
   */
  append(statement) {
    if (statement instanceof SQLStatement) {
      this.strings[this.strings.length - 1] += statement.strings[0]
      this.strings = this.strings.concat(statement.strings.slice(1))
      this._values = this.values.concat(statement._values)
    } else {
      this.strings[this.strings.length - 1] += statement
    }
    return this
  }

  /**
   * Use a prepared statement with Sequelize.
   * Makes `query` return a query with `$n` syntax instead of `?`  and switches the `values` key name to `bind`
   * @param {boolean} [value=true] value If omitted, defaults to `true`
   * @returns this
   */
  useBind(value) {
    if (value === undefined) {
      value = true
    }
    if (value && !this.bind) {
      this.bind = this._values
      delete this._values
    } else if (!value && this.bind) {
      this._values = this.bind
      delete this.bind
    }
    return this
  }

  /**
   * @param {string} name
   * @returns {this}
   */
  setName(name) {
    this.name = name
    return this
  }
}

/** Returns the SQL Statement for mysql */
Object.defineProperty(SQLStatement.prototype, 'sql', {
  enumerable: true,
  get() {
    return this.strings.join('?')
  }
})

/**
 * @param {string[]} strings
 * @param {...any} values
 * @returns {SQLStatement}
 */
function SQL(strings) {
  return new SQLStatement(strings.slice(0), Array.from(arguments).slice(1))
}

module.exports = SQL
module.exports.SQL = SQL
module.exports.default = SQL
module.exports.SQLStatement = SQLStatement
module.exports.DEFAULT = DEFAULT
