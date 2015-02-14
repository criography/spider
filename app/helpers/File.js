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
	 * @this      {object}                            Main Object
	 * @param     {string}          sourceDir         source directory for the file.
	 * @param     {string}          sourceName        filename to be processed (can be subpath)
	 * @param     {string}          destinationDir    path to where the file should go, starting from the component root.
	 * @param     {string|null}     destinationName   new filename to be used when saving (can be subpath).
	 *                                                Defaults to sourceName.
	 * @param     {object}          needles           object containing all available strings to be used as replacers
	 * @param     {function}        callback          callback to be passed back to async
	 *
	 * @return    void
	 * -----------------------------------------------------------------------------*/

		mustacheReplacer : function (sourceDir, sourceName, destinationDir, destinationName, needles, callback) {

			/* if all is set read the file */
			if (needles && callback) {
				destinationName = destinationName || sourceName;

				fs.readFile(
					sourceDir + sourceName, {encoding : 'utf8'}, function (err, data) {
						if (err) {
							throw err;
						}


						fs.writeFile(
							'./' + (destinationDir || '') + destinationName, mustache.render(data, needles), function (err) {
								if (err) {
									throw err;
								}

								Log.status('Created ' + destinationName);
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
