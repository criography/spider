"use strict";
/*jshint smarttabs: true */


// Private
var inquirer = require('inquirer');
var async = require('async');
var fs = require('fs');
var rmdir = require('rimraf');

var Vars = require('./Vars');
var Log = require('./helpers/Log');
var File = require('./helpers/File');







var Delete = function Delete(params) {
	this.params = params;


	this.paths = {
		storage : '', /* base path to where all components are being stored ('vendors' pretty much) */

		component : {
			relative : '', /* composite/relative path from components root (storage) to the current component's location */
			absolute : ''             /* full path from cwd (project root?) to the current component's location */
		},

		config : {
			sock : ''              /* project's spiderSock config filename */
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
		sock                    : '', /* project's spidersock.json contents (actual data) */
		componentGroupSeparator : ''     /* separator used in builder config files/controllers for
		 /* separating component groups, allowing for correct injection of a current component */
	};


	this.init();
};






/**-----------------------------------------------------------------------------
 * init
 * -----------------------------------------------------------------------------
 * define what gets triggered when based on CMD arguments
 *
 * @constructor
 * @return void
 * -----------------------------------------------------------------------------*/
Delete.prototype.init = function () {

	var _this = this;
	
	if(_this.params._[1]){

		_this.parseComponentNamespace();
		_this.definePathsAndConfigs();

	}else{
		//_this.browseComponents();
	}



	if(_this.params.hard){
		console.log('kill it all');
		//@TODO add destroying repo etc

	}else {
		async.parallel(
			[

				function (callback) {
					_this.deleteComponent(callback);
				},

				function (callback) {
					_this.cleanupProject(callback);
				}

			],

			function (err) {
				callback();
			}
		);
	}


};
/**-----------------------------------------------------------------------------
 * ENDOF: init
 * -----------------------------------------------------------------------------*/








/**-----------------------------------------------------------------------------
 * parseComponentNamespace
 * -----------------------------------------------------------------------------
 * sets and caches all required paths
 *
 * @private
 * @this      object                  Main Object
 * @param     callback    function    Async callback
 * @return    void
 * -----------------------------------------------------------------------------*/

Delete.prototype.parseComponentNamespace = function () {

	var _segments = this.params._[1].split(/\/|\\/);

	if(_segments.length===3){

		this.component.type   = _segments[0];
		this.component.group  = _segments[1];
		this.component.slug   = _segments[2];

	}else{

		Log.error('Couldn\'t parse the namespace. Make sure its: type\\group\\slug');
	}

};
/**-----------------------------------------------------------------------------
 * ENDOF: parseComponentNamespace
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

Delete.prototype.definePathsAndConfigs = function () {

	this.paths.config.sock = Vars.paths.projectRoot + '/spidersock.json';

	/* @TODO check if file exists and is valid otherwise suggest initiating project (spider project init)*/
	this.config.sock = require(this.paths.config.sock);

	this.paths.storage = './' + ( this.config.sock['installer-path'] || 'components/' );
	this.paths.component.relative = this.component.type + '/' + this.component.group + '/' + this.component.slug;

	/* @TODO check if path exists, if not prompt to create it */
	this.paths.component.absolute = this.paths.storage + this.paths.component.relative + '/';

	/* cache current component's controller marker/separator */
	this.config.componentGroupSeparator = Vars.projectControllerMarker.split('{{type}}').join(this.component.type);


	Log.status('Resolved all necessary paths');

};
/**-----------------------------------------------------------------------------
 * ENDOF: definePathsAndConfigs
 * -----------------------------------------------------------------------------*/










/**-----------------------------------------------------------------------------
 * deleteComponent
 * -----------------------------------------------------------------------------
 * define what gets triggered when based on CMD arguments
 *
 * @constructor
 * @return void
 * -----------------------------------------------------------------------------*/
Delete.prototype.deleteComponent = function (callback) {

	if (fs.existsSync(this.paths.component.absolute)) {
		// Do something
		rmdir(
			this.paths.component.absolute,
			function (error) {
				if(error){
					Log.error('Couldn\'t remove the component');
				}

				Log.status('Removed Component Files');
				callback();
			}
		);

	}else{
		Log.error('Couldn\'t find the component in: ' + this.paths.component.absolute);

	}


};
/**-----------------------------------------------------------------------------
 * ENDOF: deleteComponent
 * -----------------------------------------------------------------------------*/









/**-----------------------------------------------------------------------------
 * cleanupProject
 * -----------------------------------------------------------------------------
 * define what gets triggered when based on CMD arguments
 *
 * @constructor
 * @return void
 * -----------------------------------------------------------------------------*/
Delete.prototype.cleanupProject = function (callback) {


};
/**-----------------------------------------------------------------------------
 * ENDOF: cleanupProject
 * -----------------------------------------------------------------------------*/







module.exports = Delete;