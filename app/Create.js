/** =======================================================================================================================
 * HELPERS
 * ======================================================================================================================= */
/*jshint smarttabs: true */


// Private
var inquirer = require('inquirer');
var chalk = require('chalk');
var sanitize = require('sanitize-filename');
var Vars = require('./Vars');




var Create = function Create(freshStart) {
	"use strict";

	this.freshStart = typeof freshStart !== 'undefined';
console.log(this.freshStart);

	/* composite path from components root to the current component's location */
	this.componentPath = '';

	/* full path from cwd to the current component's location */
	this.componentRoot = '';

	/* inquirer placehoders for answers */
	this.componentName    = '';
	this.componentSlug    = '';
	this.componentGroup   = '';
	this.componentType    = '';
	this.componentDeps    = '';
	this.componentPhp     = '';
	this.componentJs      = '';
	this.componentJsName  = '';



	//this.sockConfigPath = this.projectRoot + '/spidersock.json';
	//this.sockConfig = require(this.sockConfigPath);



	/* ask me questions, Sire */
	this.prompts = [
		{
			type     : 'input',
			name     : 'componentName',
			validate : function (value) {
										var pass = value.match(/^[A-Za-z0-9 :-_]{3,}$/);

										return pass ? true : "[A-Za-z0-9 :-_]{3,} Learn your RegEx, for crying out loud!";
									},
			message  : 'Gimme thy component\'s name. [A-Za-z0-9 :-_]{3,}'
		},

		{
			type     : 'input',
			name     : 'componentSlug',
			validate : function (value) {
										var pass = value.match(/^[A-Za-z0-9-_]{3,}$/);

										return pass ? true : "[A-Za-z0-9-_]{3,} Learn your RegEx, for crying out loud!";
									},
			message  : 'Gimme thy component\'s slug. [A-Za-z0-9-_]{3,}'
		},

		{
			type     : 'input',
			name     : 'componentGroup',
			validate : function (value) {
										var pass = value.match(/^[a-z0-9-_]{3,}$/);

										return pass ? true : "[a-z0-9-_]{3,} Learn your RegEx, for crying out loud!";
									},
			message  : 'Gimme thy component\'s functional group. [a-z0-9-_]{3,}'
		},

		{
			type    : 'list',
			name    : 'componentType',
			message : 'What type of component is it?',
			choices : ['atom', 'molecule', 'organism', 'template', 'page'],
			default : 'atom'
		},

		{
			type    : 'input',
			name    : 'componentDeps',
			message : 'Any git dependencies? (comma separated git repo URLs only)'
		},


		{
			type    : 'list',
			name    : 'componentPhp',
			message : 'Create PHP Class?',
			choices : ['nope', 'yep'],
			default : 'nope'

		},

		{
			when       : function (props) {
				return props.componentPhp === 'yep';
			},
			name       : 'componentPhpName',
			type       : 'input',
			required   : true,
			pattern    : /^[A-Za-z0-9-_]*$/,
			message: 'OK then, so what\'s the filename of PHP Class?',
			default    : function (props) {

				return  'SSK_' + props.componentSlug.replace(/[-_]+/g, ' ').
									replace(
										/\b\w+/g,
										function (s) {
											return s.charAt(0).toUpperCase() + s.substr(1);
										}
									).
									replace(/\s/g, '_') + '.php';
			}
		},

		{
			type    : 'list',
			name    : 'componentJs',
			message : 'Create JS Module?',
			choices : ['nope', 'yep'],
			default : 'nope'
		},

		{
			when       : function (props) {
				return props.componentJs === 'yep';
			},
			name       : 'componentJsName',
			type       : 'input',
			required   : true,
			pattern    : /^[A-Za-z0-9-_]*$/,
			message: 'OK then, so what\'s the filename of JS module?',
			default    : function (props) {

				return  props.componentSlug.replace(/[-_]+/g, ' ').
									replace(
										/\b\w+/g,
										function (s) {
											return s.charAt(0).toUpperCase() + s.substr(1);
										}
									).
									replace(/\s/g, '_') + '.js';
			}
		}

	];


	this.init();

};








Create.prototype = {

	/**-----------------------------------------------------------------------------
	 * init
	 * -----------------------------------------------------------------------------
	 * sets up prompt
	 *
	 * @constructor
	 * @return void
	 * -----------------------------------------------------------------------------*/

		init : function(){
			"use strict";

		//console.log(freshStart);
			var _this = this;

			inquirer.prompt( this.prompts, function (answers) {
					this.componentName    = answers.componentName;
					this.componentSlug    = sanitize(answers.componentSlug.replace(/\s+/g, '-'));
					this.componentGroup   = answers.componentGroup;
					this.componentType    = answers.componentType;
					this.componentDeps    = answers.componentDeps;
					this.componentPhp     = answers.componentPhp;
					this.componentJs      = answers.componentJs;
					this.componentJsName  = answers.componentJsName;


					this.setPaths();
				}.bind(this)
			);
		},

	/**-----------------------------------------------------------------------------
	 * ENDOF: init
	 * -----------------------------------------------------------------------------*/






/**-----------------------------------------------------------------------------
 * setPaths
 * -----------------------------------------------------------------------------
 * sets and caches all required paths
 *
 * @private
 * @this      object        Main Object
 * @return    void
 * -----------------------------------------------------------------------------*/

	setPaths : function(){
		"use strict";

		this.componentPath = this.componentType + 's/' + this.componentGroup + '/' + this.componentSlug;
		//this.componentRoot = './' + ( this.sockConfig['installer-path'] || 'components/' ) + this.componentPath + '/';

		console.log(this.componentPath);
	}

/**-----------------------------------------------------------------------------
 * ENDOF: setPaths
 * -----------------------------------------------------------------------------*/


};



/* seems hacky, read up and ask people what's the best way to do this */
module.exports = function(freshStart){
	"use strict";

	return new Create(freshStart);
};