"use strict";
/*jshint smarttabs: true */


// Private
var inquirer = require('inquirer');
var async = require('async');
var fs = require('fs');

var Vars = require('./Vars');
var Log = require('./helpers/Log');
var File = require('./helpers/File');







var Init = function Init(name) {
	this.name = name || 'Jane';
	this.greet(this.name);
};

Init.prototype.greet = function () {
	console.log("Hi, I'm " + this.name );
};

module.exports = Init;