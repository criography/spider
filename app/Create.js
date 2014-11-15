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


	h1 : function(callback){
		setTimeout(
			function () {
				console.log(1);
				callback();
			}, 1000
		);
	},
	h2: function(callback){
		setTimeout(
			function () {
				console.log(2);
				callback();
			}, 2000
		);
	},

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
				_this.componentName    = answers.componentName;
				_this.componentSlug    = sanitize(answers.componentSlug.replace(/\s+/g, '-'));
				_this.componentGroup   = answers.componentGroup;
				_this.componentType    = answers.componentType;
				_this.componentDeps    = answers.componentDeps;
				_this.componentPhp     = answers.componentPhp;
				_this.componentJs      = answers.componentJs;
				_this.componentJsName  = answers.componentJsName;


				async.series([
					function (callback) {
						_this.definePathsAndConfigs(callback);
					},
					
					function (callback) {
						_this.createDirs(callback);
					},
					 
					function(callback){
						async.parallel([
							function (callback) {
								_this.copyTemplates(callback);
							},

							function (callback) {
								_this.createSpiderJson(callback);
							},

							function (callback) {
								_this.createPackageJson(callback);
							},

							function (callback) {
								_this.createBowerJson(callback);
							},

							function (callback) {
								_this.generateScssControllers(callback);
							},

							function (callback) {
								_this.generateJsModule(callback);
							},

							function (callback) {
								_this.generatePhpClass(callback);
							},

							function (callback) {
								_this.updateSpidersockJson(callback);
							},

							function (callback) {
								_this.includeScss(callback);
							},

							function (callback) {
								_this.installDependencies(callback);
							}
								
						]);
					}
				]);


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
	 * @this      object                  Main Object
	 * @param     callback    function    Async callback
	 * @return    void
	 * -----------------------------------------------------------------------------*/

		definePathsAndConfigs : function(callback){
			this.sockConfigPath = Vars.projectRoot + '/spidersock.json';

			/* @TODO check if file exists otherwise suggest initiating project */
			this.sockConfig = require(this.sockConfigPath);

			this.componentsBasePath = './' + ( this.sockConfig['installer-path'] || 'components/' );
			this.componentPath = this.componentType + 's/' + this.componentGroup + '/' + this.componentSlug;
		/* @TODO check if path exists, if not prompt to create it */
			this.componentRoot = this.componentsBasePath + this.componentPath + '/';

			callback();
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
	 * @this      object                  Main Object
	 * @param     callback    function    Async callback
	 * @return    void
	 * -----------------------------------------------------------------------------*/

		createDirs : function(callback){
			var _this = this;


		fs.exists(
				_this.componentsBasePath, function (exists) {

					if(exists){

						/* create directory structure to the new component's root */
						mkdirp(
							_this.componentsBasePath + _this.componentPath,
							function (err) {
								if (err) {
									console.error(err);
								}

								/* change current path to new component root */
								process.chdir(_this.componentsBasePath + _this.componentPath);

								/* create new component directory structure */
								fs.mkdir('theme', '0755');
								mkdirp(
									'core/lib',
									function(error){
										callback();
									}
								);

							}
						);

					/* prompt to create or create automatically ? */
					}else{
						console.log('Path: ' + _this.componentsBasePath + ' doesn\'t seem to exist');
						console.log('Path: ' + _this.componentsBasePath + ' doesn\'t seem to exist');

						inquirer.prompt(
							_this.prompts, function (answers) {

								/* rerun this function */
								_this.createDirs();

							}.bind(this)
						);
					}
				}
			);

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
 * @this      object                  Main Object
 * @param     callback    function    Async callback
 * @return    void
 * -----------------------------------------------------------------------------*/

	createSpiderJson : function(callback){

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
 * @this      object                  Main Object
 * @param     callback    function    Async callback
 * @return    void
 * -----------------------------------------------------------------------------*/

	copyTemplates : function (callback) {

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
	 * @this      object                  Main Object
	 * @param     callback    function    Async callback
	 * @return    void
	 * -----------------------------------------------------------------------------*/

	createPackageJson : function (callback) {

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
 * @this      object                  Main Object
 * @param     callback    function    Async callback
 * @return    void
 * -----------------------------------------------------------------------------*/

	createBowerJson : function (callback) {

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
 * @this      object                  Main Object
 * @param     callback    function    Async callback
 * @return    void
 * -----------------------------------------------------------------------------*/

	generateScssControllers : function (callback) {

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
	 * @this      object                  Main Object
	 * @param     callback    function    Async callback
	 * @return    void
	 * -----------------------------------------------------------------------------*/

	generateJsModule : function (callback) {

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
 * @this      object                  Main Object
 * @param     callback    function    Async callback
 * @return    void
 * -----------------------------------------------------------------------------*/

	generatePhpClass : function (callback) {

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
 * @this      object                  Main Object
 * @param     callback    function    Async callback
 * @return    void
 * -----------------------------------------------------------------------------*/

	updateSpidersockJson : function (callback) {

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
 * @this      object                  Main Object
 * @param     callback    function    Async callback
 * @return    void
 * -----------------------------------------------------------------------------*/

	includeScss : function (callback) {

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
 * @this      object                  Main Object
 * @param     callback    function    Async callback
 * @return    void
 * -----------------------------------------------------------------------------*/

	installDependencies : function (callback) {

	}

/**-----------------------------------------------------------------------------
 * ENDOF: installDependencies
 * -----------------------------------------------------------------------------*/



};



/* seems hacky, read up and ask people what's the best way to do this */
module.exports = new Create();