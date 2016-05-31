'use strict'

var mysqlPromise = require('mysql-promise')
var db = mysqlPromise()

var connection = {
	query: function (query, parameterValues) {
		return db.query.apply(db, arguments).then(function (rowsAndInfo) {
			return rowsAndInfo[0]
		})
	}
}

function Data (config, tableName, tableID) {
	this.tableName = tableName
	this.tableID = tableID
	this.query = connection.query
	db.configure(config)
}

function give (value) {
	return function () {
		return value
	}
}

module.exports = Data

Data.prototype.create = function (record) {
	var sql = 'INSERT INTO ' + this.tableName + '('

	var keys = []
	var values = []

	for (var key in record) {
		if (key !== this.tableID) {
			keys.push(key)
			values.push(record[key])
		}
	}

	sql += keys.map(give('??')).join() + ') VALUES (' + values.map(give('?')).join() + ')'
	return connection.query(sql, keys.concat(values)).then(function (result) {
		return result.insertId
	})

	function give (value) {
		return function () {
			return value
		}
	}
}

Data.prototype.createMultiple = function (records) {
	var keys = []
	var valuesMatrix = []

	var record = records[0]

	var key, i

	for (key in record) {
		if (key !== this.tableID) {
			keys.push(key)
		}
	}

	var values = []

	for (i = 0; i < records.length; i++) {
		record = records[i]

		for (key in record) {
			if (key !== this.tableID) {
				values.push(record[key])
			}
		}

		valuesMatrix.push(values)
	}

	var valuesString = ''

	for (i = 0; i < valuesMatrix.length; i++) {
		if (valuesString.length > 0) {
			valuesString += ','
		}

		valuesString += '(' + keys.map(give('?')).join() + ')'
	}

	var sql = 'INSERT INTO ' + this.tableName + '('
	sql += keys.map(give('??')).join() + ') VALUES ' + valuesString

	return connection.query(sql, keys.concat(values)).then(function (result) {
		return 0
	// return result.insertId
	})
}

Data.prototype.read = function (recordID) {
	var sql = 'SELECT * FROM ' + this.tableName + ' WHERE ' + this.tableID + ' = ?'

	return connection.query(sql, recordID).then(function (results) {
		if (results && results.length === 1) {
			return (results[0])
		} else {
			return null
		}
	})
}

Data.prototype.update = function (record) {
	var sql = 'UPDATE ' + this.tableName + ' SET '

	var parameters = []
	var queryItems = []

	for (var key in record) {
		if (key !== this.tableID) {
			queryItems.push('?? = ?')
			parameters.push(key, record[key])
		}
	}

	sql += queryItems.join() + ' WHERE ' + this.tableID + ' = ' + record[this.tableID]

	return connection.query(sql, parameters)
}

Data.prototype.delete = function (recordID) {
	var sql = 'DELETE FROM ' + this.tableName + ' WHERE ' + this.tableID + ' = ?'

	return connection.query(sql, recordID).then(function (result) {
		return result.affectedRows
	})
}

Data.prototype.exists = function (recordID) {
	var sql = 'SELECT COUNT(*) count FROM ' + this.tableName + ' WHERE ' + this.tableID + ' = ?'

	return connection.query(sql, recordID).then(function (result) {
		return result[0].count >= 1
	})
}

Data.prototype.listAll = function () {
	var sql = 'SELECT * FROM ' + this.tableName

	return connection.query(sql)
}
