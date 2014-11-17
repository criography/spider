"use strict";
/*jshint smarttabs: true */



var chalk = require('chalk');


var Log = function Log() {
// @TODO clean this shit up
		/**-----------------------------------------------------------------------------
		 * _log
		 * -----------------------------------------------------------------------------
		 *
		 * @private
		 * @this  {object}
		 * @param {string} msg desc
		 * @param {string} type desc
		 * @return
		 * -----------------------------------------------------------------------------*/

			var _log = function(msg, type){
			var prefix = '';
				switch (type) {
					case 'error':
						prefix = chalk.white.bgRed.bold(  '[spider] error:  ');
						break;

					case 'warn':
						prefix = chalk.white.bgRed.bold(  '[spider] warning:');
						break;

					default:
						prefix = chalk.white.bgGreen.bold('[spider] status: ');

				}

		    console.log(prefix, msg );
			};

		/**-----------------------------------------------------------------------------
		 * ENDOF: _log
		 * -----------------------------------------------------------------------------*/


		this.error = function (msg) {
			_log(msg, 'error');
		};

		this.warn = function (msg) {
			_log(msg, 'warn');
		};

		this.status = function (msg) {
			_log(msg);
		};


};






/* seems hacky, read up and ask people what's the best way to do this */
module.exports = new Log();