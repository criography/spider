/** =======================================================================================================================
 * HELPERS
 * ======================================================================================================================= */
/*jshint smarttabs: true */



var path = require('path');

// Private

var Vars = function () {
	"use strict";

	/* full OS path to the templates dir of component */
	this.templatesPath     = '';

	/* project root. Should it be cached? */
	this.projectRoot = process.cwd();

	/* marker string placed in controller files to define injection places */
	/* @TODO separate imports to separate files, which will remove the need for it */
	this.projectControllerMarker = '';


	this.init();

};








Vars.prototype = {

	/**-----------------------------------------------------------------------------
	 * init
	 * -----------------------------------------------------------------------------
	 * sets up prompt
	 *
	 * @constructor
	 * @return void
	 * -----------------------------------------------------------------------------*/

	init : function () {
		"use strict";

		this.setVars();
	},

	/**-----------------------------------------------------------------------------
	 * ENDOF: init
	 * -----------------------------------------------------------------------------*/






	/**-----------------------------------------------------------------------------
	 * setVars
	 * -----------------------------------------------------------------------------
	 * sets and caches all required paths
	 *
	 * @private
	 * @this      object        Main Object
	 * @return    void
	 * -----------------------------------------------------------------------------*/

	setVars : function () {
		"use strict";

		this.templatesPath            = __dirname + '/templates/';

		this.projectControllerMarker  = '/* --spiders:{{type}}s-- */';
	}

	/**-----------------------------------------------------------------------------
	 * ENDOF: setVars
	 * -----------------------------------------------------------------------------*/


};


module.exports = new Vars();