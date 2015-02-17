"use strict";
/*jshint smarttabs: true */


// Private
var inquirer  = require('inquirer');
var sanitize  = require('sanitize-filename');
var async     = require('async');
var fs        = require('fs');
var path      = require('path');
var mkdirp    = require('mkdirp');
var ncp       = require('ncp');
var readdirSyncRecursive = require('fs-readdir-recursive');

var Vars      = require('./Vars');
var Log       = require('./helpers/Log');
var File      = require('./helpers/File');






var Create = function Create() {


	this.paths            = {
		storage     : '',           /* base path to where all components are being stored ('vendors' pretty much) */

		component   : {
			relative : '',            /* composite/relative path from components root (storage) to the current component's location */
			absolute : ''             /* full path from cwd (project root?) to the current component's location */
		},

		config      : {
			sock    : ''              /* project's spiderSock config filename */
		}
	};


	/* all component data, gathered from and composed based on prompt */
	this.component = {
		name    : '',
		slug    : '',
		group   : '',
		type    : '',
		deps    : [],
		php     : '',
		phpName : '',
		js      : '',
		jsName  : '',
		repo    : ''
	};
	


	/* config data */
	this.config = {
		sock                      : '',                               /* project's spidersock.json contents (actual data) */
		componentGroupSeparator   : ''     /* separator used in builder config files/controllers for
		                                                              /* separating component groups, allowing for correct injection of a current component */
	};


	
	//this.paths.config.sock = this.projectRoot + '/spidersock.json';
	//this.config.sock = require(this.paths.config.sock);



	/* ask me questions, Sire */
	this.prompts = [
		{
			type     : 'input',
			name     : 'componentName',
			validate : function (value) {
										var pass = value.match(/^[A-Za-z0-9 :-_/,\.\[\]\(\)]{3,}$/);

										return pass ? true : "[A-Za-z0-9 :-_/,\\.\\[\\]\\(\\)]{3,} Learn your RegEx, for crying out loud!";
									},
			message  : 'New component\'s name. [A-Za-z0-9 :-_/,\\.\\[\\]\\(\\)]{3,}'
		},

		{
			type     : 'input',
			name     : 'componentSlug',
			validate : function (value) {
										var pass = value.match(/^[A-Za-z0-9-_]{3,}$/);

										return pass ? true : "[A-Za-z0-9-_]{3,} Learn your RegEx, for crying out loud!";
									},
			message  : 'New component\'s slug. [A-Za-z0-9-_]{3,}'
		},

		{
			type     : 'input',
			name     : 'componentGroup',
			validate : function (value) {
										var pass = value.match(/^[a-z0-9-_]{3,}$/);

										return pass ? true : "[a-z0-9-_]{3,} Learn your RegEx, for crying out loud!";
									},
			message  : 'New component\'s functional group. [a-z0-9-_]{3,}'
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
			message: 'OK then, so what\'s the filename of PHP Class? (exclude extension)',
			default    : function (props) {

				return  'SSK_' + props.componentSlug.replace(/[-_]+/g, ' ').
									replace(
										/\b\w+/g,
										function (s) {
											return s.charAt(0).toUpperCase() + s.substr(1);
										}
									).
									replace(/\s/g, '_');
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
			message: 'OK then, so what\'s the filename of JS module? (exclude extension)',
			default    : function (props) {

				return  props.componentSlug.replace(/[-_]+/g, ' ').
									replace(
										/\b\w+/g,
										function (s) {
											return s.charAt(0).toUpperCase() + s.substr(1);
										}
									).
									replace(/\s/g, '_');
			}
		},

		{
			type    : 'list',
			name    : 'createRepo',
			message : 'Create new repository?',
			choices : ['nope', 'yep'],
			default : 'nope'

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
				_this.component.name    = answers.componentName;
				_this.component.slug    = sanitize(answers.componentSlug.replace(/\s+/g, '-'));
				_this.component.group   = answers.componentGroup;
				_this.component.type    = answers.componentType;
				_this.component.deps    = answers.componentDeps;
				_this.component.php     = answers.componentPhp;
				_this.component.phpName = answers.componentPhpName;
				_this.component.js      = answers.componentJs;
				_this.component.jsName  = answers.componentJsName;
				_this.component.repo    = answers.createRepo;


				async.series([
					function (callback) {
						_this.definePathsAndConfigs(callback);
					},
					
					function (callback) {
						_this.createDirs(callback);
					},

					function (callback) {
						_this.copyTemplates(callback);
					}, 
					

					function(callback) {
						async.parallel([

							function (callback) {
								_this.processDynamicTemplates(callback);
							},

							function (callback) {
								_this.processOptionalTemplates(callback);
							}

						],

						function (err) {
							callback();
						});
					},

					function(callback){
						async.parallel([

							function (callback) {
								_this.renameDynamicTemplates(callback);
							},
							 /*,
							function (callback) {
								_this.renameDynamicTemplates(callback);
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
*/
							function (callback) {
								_this.updateSpidersockJson(callback);
							},

							function (callback) {
								_this.updateScssController(callback);
							}
 /*
							function (callback) {
								_this.installDependencies(callback);
							}*/
								
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

			this.paths.config.sock = Vars.paths.projectRoot + '/spidersock.json';

			/* @TODO check if file exists and is valid otherwise suggest initiating project (spider project init)*/
			this.config.sock = require(this.paths.config.sock);

			this.paths.storage = './' + ( this.config.sock['installer-path'] || 'components/' );
			this.paths.component.relative = this.component.type + 's/' + this.component.group + '/' + this.component.slug;

		/* @TODO check if path exists, if not prompt to create it */
			this.paths.component.absolute = this.paths.storage + this.paths.component.relative + '/';

			/* cache current component's controller marker/separator */
			this.config.componentGroupSeparator = Vars.projectControllerMarker.split('{{type}}').join(this.component.type);


			Log.status('Resolved all necessary paths');
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
	 * @TODO clean this shit up.
	 * @private
	 * @this      object                  Main Object
	 * @param     callback    function    Async callback
	 * @return    void
	 * -----------------------------------------------------------------------------*/

		createDirs : function(callback){
			var _this = this;


		fs.exists(
				_this.paths.storage, function (exists) {

					if(exists){

						/* create directory structure to the new component's root */
						mkdirp(
							_this.paths.storage + _this.paths.component.relative,
							function (err) {
								if (err) {
									console.error(err);
								}

								/* change current path to new component root */
								process.chdir(_this.paths.storage + _this.paths.component.relative);

								Log.status('Created component path');
								callback();

							}
						);

					/* prompt to create or create automatically ? */
					}else{
						console.log('Path: ' + _this.paths.storage + ' doesn\'t seem to exist');

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

		ncp(
			Vars.paths.templates + '/static/', './', function (err) {
				if (err) {
					return console.error(err);
				}

				Log.status('Created component directory structure');
				Log.status('Created static files');
				callback();
			}
		);
	},

/**-----------------------------------------------------------------------------
 * ENDOF: copyTemplates
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

	createSpiderJson : function (callback) {
		var _this = this;



	},

	/**-----------------------------------------------------------------------------
	 * ENDOF: createSpiderJson
	 * -----------------------------------------------------------------------------*/





	/**-----------------------------------------------------------------------------
	 * processDynamicTemplates
	 * -----------------------------------------------------------------------------
	 * reads all files from 'templates/dynamic' folder,
	 * replaces all mustache tags
	 * and saves it to the destination location
	 *
	 * @private
	 * @this      object                  Main Object
	 * @param     callback    function    Async callback
	 * @return    void
	 * -----------------------------------------------------------------------------*/

	processDynamicTemplates : function (callback) {
		var _this             = this,
				dynamicTemplates  = readdirSyncRecursive(Vars.paths.templates + 'dynamic/');


		if(dynamicTemplates){

			async.map(
				dynamicTemplates,

				function (filename, callback) {
					File.mustacheReplacer(
						Vars.paths.templates + 'dynamic/',
						filename,
						_this.paths.absolute,
						null,
						_this.component,
						callback
					);
				},

				function(err){
					if(err){
						return console.error(err);
					}

					callback();
				}
			);

		}



	},

	/**-----------------------------------------------------------------------------
	 * ENDOF: processDynamicTemplates
	 * -----------------------------------------------------------------------------*/







	/**-----------------------------------------------------------------------------
	 * processOptionalTemplates
	 * -----------------------------------------------------------------------------
	 * reads all files from 'templates/dynamic' folder,
	 * replaces all mustache tags
	 * and saves it to the destination location
	 *
	 * @private
	 * @this      object                  Main Object
	 * @param     callback    function    Async callback
	 * @return    void
	 * -----------------------------------------------------------------------------*/

	processOptionalTemplates : function (callback) {
		var _this             = this,
				dynamicTemplates  = readdirSyncRecursive(Vars.paths.templates + 'optional/');


				async.parallel(
					[
						function (callback) {
							if(_this.component.jsName){

								File.mustacheReplacer(
									Vars.paths.templates + 'optional/',
									'module.js',
									_this.paths.absolute,
									_this.component.jsName + '.js',
									_this.component,
									callback
								);

							}else{
								callback();

							}
						},

						function (callback) {
							if (_this.component.phpName) {

								File.mustacheReplacer(
									Vars.paths.templates + 'optional/',
									'generator.php',
									_this.paths.absolute,
									_this.component.phpName + '.php',
									_this.component,
									callback
								);

							} else {
								callback();

							}
						}
					],

					function (err) {
						if (err) {
							return console.error(err);
						}

						callback();
					}
				);


	},

	/**-----------------------------------------------------------------------------
	 * ENDOF: processOptionalTemplates
	 * -----------------------------------------------------------------------------*/








	/**-----------------------------------------------------------------------------
	 * renameDynamicTemplates
	 * -----------------------------------------------------------------------------
	 * once all dynamic templates are processed and renamed,
	 * make sure that all names are component specific.
	 *
	 * @private
	 * @this      object                  Main Object
	 * @param     callback    function    Async callback
	 * @return    void
	 * -----------------------------------------------------------------------------*/

	renameDynamicTemplates : function (callback) {
		var _this   = this,
				mods  = [
					{
						src  : './core/_controller.scss',
						dest : './core/_' + _this.component.slug + '.scss'
					},
					{
						src  : './theme/_theme.scss',
						dest : './theme/_' + _this.component.slug + '--theme.scss'
					}
				];


		async.map(
			mods,

		  function (file, callback){
				fs.rename(file.src, file.dest, callback);
		  },

			function (err) {
				if (err) {
					return console.error(err);
				}

				callback();
			}
		);
	},

	/**-----------------------------------------------------------------------------
	 * ENDOF: renameDynamicTemplates
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
		var _this       = this;

		/* @TODO inject the right repo details or fall back to empty string */
		_this.config.sock.dependencies[
			_this.component.type + '/' + _this.component.group + '/' + _this.component.slug
		] = "{{repo}}";


		fs.writeFile(
			_this.paths.config.sock,
			JSON.stringify(_this.config.sock, null, "\t"),
			function (err) {
				if (err) {
					return console.error(err);
				}

				Log.status('Updated project\'s spidersock.json');
				callback();
			}
		);

	},

/**-----------------------------------------------------------------------------
 * ENDOF: updateSpidersockJson
 * -----------------------------------------------------------------------------*/





/**-----------------------------------------------------------------------------
 * updateScssController
 * -----------------------------------------------------------------------------
 * Includes Project's SCSS controllers with correct includes
 *
 * @private
 * @this      object                  Main Object
 * @param     callback    function    Async callback
 * @return    void
 * -----------------------------------------------------------------------------*/

	updateScssController : function (callback) {
		var _this       = this,
				controllers = _this.config.sock.builders.scss;

		if(controllers){
			if(typeof controllers === 'string'){
				var controllerPath = Vars.paths.projectRoot + '/' + controllers;

				fs.readFile(
					controllerPath, 'utf8', function (err, data) {
						if (err) {
							return console.log(err);
						}

						data = data.split(_this.config.componentGroupSeparator).
										join('@import "' + _this.paths.component.relative + '/component";' + "\n" + _this.config.componentGroupSeparator);

						fs.writeFile(
							controllerPath,
							data,
							function (err) {
								if (err) {
									return console.error(err);
								}

								Log.status('Updated project\'s SCSS controller');
								callback();
							}
						);
					}
				);

			}else{
				/* @TODO Add capability of inserting into multiple controllers */
				console.log();
			}
		}
	},

/**-----------------------------------------------------------------------------
 * ENDOF: updateScssController
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