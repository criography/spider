"use strict";
/*jshint smarttabs: true */

var fs        = require('fs');
var path      = require('path');
var mustache  = require('mustache');

var Vars      = require('../Vars');
var Log       = require('./Log');




module.exports =  {

	/**-----------------------------------------------------------------------------
	 * mustacheReplacer
	 * -----------------------------------------------------------------------------
	 * reads given file, replaces all mustache tags and saves the output to specified location
	 *
	 * @this      {object}                    Main Object
	 * @param     {string}    filename        file to be processed
	 * @param     {object}    needles         object containing all available strings to be used as replacers
	 * @param     {function}  callback        callback to be passed back to async
	 * @param     {string}    destinationDir  path to where the file should go, starting from the component root.
	 * @return    void
	 * -----------------------------------------------------------------------------*/

		mustacheReplacer : function (filename, needles, callback, destinationDir) {

			/* if all is set read the file */
			if (filename && needles && callback) {
				fs.readFile(
					Vars.paths.templates + '/' + filename, {encoding : 'utf8'}, function (err, data) {
						if (err) {
							throw err;
						}

						/* process data and save it to a file */
						fs.writeFile(
							'./' + (destinationDir || '') + filename, mustache.render(data, needles), function (err) {
								if (err) {
									throw err;
								}

								Log.status('Created ' + filename);
								callback();
							}
						);
					}
				);
			}
		}

	/**-----------------------------------------------------------------------------
	 * ENDOF: mustacheReplacer
	 * -----------------------------------------------------------------------------*/

};
