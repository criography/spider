"use strict";
/*jshint smarttabs: true */


// Private
var inquirer = require('inquirer');
var chalk = require('chalk');
var sanitize = require('sanitize-filename');
var async = require('async');
var fs = require('fs');
var mkdirp = require('mkdirp');

var Vars = require('./Vars');




var Create = function Create() {

	/* base path to where all components are */
	this.componentsBasePath = '';

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

	this.sockConfigPath = '';
	this.sockConfig = '';
	
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

					/* this should return a promise, so async doesn't hit before containing directory is there */
					this.definePathsAndConfigs();


					async.parallel(
						[ this.createDirs(),
						  this.copyTemplates(),
						  this.createSpiderJson(),
						  this.createPackageJson(),
						  this.createBowerJson(),
						  this.generateScssControllers(),
						  this.generateJsModule(),
						  this.generatePhpClass(),
						  this.updateSpidersockJson(),
						  this.includeScss(),
						  this.installDependencies()
						], function (err) {
							if (err) {
								throw err; //Or pass it on to an outer callback, log it or whatever suits your needs
							}
							console.log('Both a and b are saved now');
						}
					);

				}.bind(this)
			);
		},

	/**-----------------------------------------------------------------------------
	 * ENDOF: init
	 * -----------------------------------------------------------------------------*/






	/**-----------------------------------------------------------------------------
	 * definePathsAndConfigs
	 * -----------------------------------------------------------------------------
	 * sets and caches all required paths
	 *
	 * @private
	 * @this      object        Main Object
	 * @return    void
	 * -----------------------------------------------------------------------------*/

		definePathsAndConfigs : function(){
			this.sockConfigPath = Vars.projectRoot + '/spidersock.json';

			/* @TODO check if file exists otherwise suggest initiating project */
			this.sockConfig = require(this.sockConfigPath);

			this.componentsBasePath = './' + ( this.sockConfig['installer-path'] || 'components/' );
			this.componentPath = this.componentType + 's/' + this.componentGroup + '/' + this.componentSlug;
		/* @TODO check if path exists, if not prompt to create it */
			this.componentRoot = this.componentsBasePath + this.componentPath + '/';
			/* */
			this.changeWorkingDir();
		},

	/**-----------------------------------------------------------------------------
	 * ENDOF: definePathsAndConfigs
	 * -----------------------------------------------------------------------------*/




	/**-----------------------------------------------------------------------------
	 * changeWorkingDir
	 * -----------------------------------------------------------------------------
	 * changes working directory to component's storage dir
	 *
	 * @private
	 * @this      object        Main Object
	 * @return    void
	 * -----------------------------------------------------------------------------*/

		changeWorkingDir : function(){

	},

	/**-----------------------------------------------------------------------------
	 * ENDOF: changeWorkingDir
	 * -----------------------------------------------------------------------------*/







	/**-----------------------------------------------------------------------------
	 * createDirs
	 * -----------------------------------------------------------------------------
	 * Create required folder structure
	 *
	 * @private
	 * @this      object        Main Object
	 * @return    void
	 * -----------------------------------------------------------------------------*/

		createDirs : function(){
			var _this = this;

			/* @TODO check if path exists, if not prompt to create it */
			try {
				process.chdir(this.componentsBasePath);
				mkdirp(
					_this.componentPath, function (err) {
						if (err){ console.error(err); }
						process.chdir(_this.componentPath);
						fs.mkdir('theme', '0755');
						fs.mkdir('core', '0755');
						fs.mkdir('core/lib', '0755');

					}
				);
			}
			catch (err) {
				console.log('could not change current directory to components storage. ' + err);
			}
		},

	/**-----------------------------------------------------------------------------
	 * ENDOF: createDirs
	 * -----------------------------------------------------------------------------*/







/**-----------------------------------------------------------------------------
 * createSpiderJson
 * -----------------------------------------------------------------------------
 * Generates component config file: spider.json
 *
 * @private
 * @this      object        Main Object
 * @return    void
 * -----------------------------------------------------------------------------*/

	createSpiderJson : function(){

	},

/**-----------------------------------------------------------------------------
 * ENDOF: createSpiderJson
 * -----------------------------------------------------------------------------*/






/**-----------------------------------------------------------------------------
 * copyTemplates
 * -----------------------------------------------------------------------------
 * Copies over all templates that don;t have to be changed
 *
 * @private
 * @this      object        Main Object
 * @return    void
 * -----------------------------------------------------------------------------*/

	copyTemplates : function(){

	},

/**-----------------------------------------------------------------------------
 * ENDOF: copyTemplates
 * -----------------------------------------------------------------------------*/





	/**-----------------------------------------------------------------------------
	 * createPackageJson
	 * -----------------------------------------------------------------------------
	 * creates package.json
	 *
	 * @private
	 * @this      object        Main Object
	 * @return    void
	 * -----------------------------------------------------------------------------*/

	createPackageJson : function(){

	},

	/**-----------------------------------------------------------------------------
	 * ENDOF: createPackageJson
	 * -----------------------------------------------------------------------------*/




/**-----------------------------------------------------------------------------
 * createBowerJson
 * -----------------------------------------------------------------------------
 * creates Bower config file, to be used if any external dependencies are present
 *
 * @private
 * @this      object        Main Object
 * @return    void
 * -----------------------------------------------------------------------------*/

	createBowerJson : function(){

	},

/**-----------------------------------------------------------------------------
 * ENDOF: createBowerJson
 * -----------------------------------------------------------------------------*/





/**-----------------------------------------------------------------------------
 * generateScssControllers
 * -----------------------------------------------------------------------------
 * Generates Component's SCSS structure
 *
 * @private
 * @this      object        Main Object
 * @return    void
 * -----------------------------------------------------------------------------*/

	generateScssControllers : function(){

	},

/**-----------------------------------------------------------------------------
 * ENDOF: generateScssControllers
 * -----------------------------------------------------------------------------*/




	/**-----------------------------------------------------------------------------
	 * generateJsModule
	 * -----------------------------------------------------------------------------
	 * Generates JS Module if required
	 *
	 * @private
	 * @this      object        Main Object
	 * @return    void
	 * -----------------------------------------------------------------------------*/

	generateJsModule : function(){

	},

	/**-----------------------------------------------------------------------------
	 * ENDOF: generateJsModule
	 * -----------------------------------------------------------------------------*/





/**-----------------------------------------------------------------------------
 * generatePhpClass
 * -----------------------------------------------------------------------------
 * Generates PHP generator class if required
 *
 * @private
 * @this      object        Main Object
 * @return    void
 * -----------------------------------------------------------------------------*/

	generatePhpClass : function(){

	},

/**-----------------------------------------------------------------------------
 * ENDOF: generatePhpClass
 * -----------------------------------------------------------------------------*/





/**-----------------------------------------------------------------------------
 * updateSpidersockJson
 * -----------------------------------------------------------------------------
 * Updates project's spidersock.json with current component
 *
 * @private
 * @this      object        Main Object
 * @return    void
 * -----------------------------------------------------------------------------*/

	updateSpidersockJson : function(){

	},

/**-----------------------------------------------------------------------------
 * ENDOF: updateSpidersockJson
 * -----------------------------------------------------------------------------*/





/**-----------------------------------------------------------------------------
 * includeScss
 * -----------------------------------------------------------------------------
 * Includes Project's SCSS controllers with correct includes
 *
 * @private
 * @this      object        Main Object
 * @return    void
 * -----------------------------------------------------------------------------*/

	includeScss : function(){

	},

/**-----------------------------------------------------------------------------
 * ENDOF: includeScss
 * -----------------------------------------------------------------------------*/





/**-----------------------------------------------------------------------------
 * installDependencies
 * -----------------------------------------------------------------------------
 * Installs dependencies if present
 *
 * @private
 * @this      object        Main Object
 * @return    void
 * -----------------------------------------------------------------------------*/

	installDependencies : function(){

	}

/**-----------------------------------------------------------------------------
 * ENDOF: installDependencies
 * -----------------------------------------------------------------------------*/



};



/* seems hacky, read up and ask people what's the best way to do this */
module.exports = new Create();