/** =======================================================================================================================
 * HELPERS
 * ======================================================================================================================= */
/*jshint smarttabs: true */


// Private

var Vars = function () {
	"use strict";

	/* full OS path to the source of component */
	this.sourcePath     = '';

	/* composite path from components root to the current component's location */
	this.componentPath  = '';


	/* full path from cwd to the current component's location */
	this.componentRoot  = '';


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

		this.setPaths();
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

	setPaths : function () {
		"use strict";

		this.sourcePath     = require.resolve('yo');
		//this.componentPath  = this.componentType + 's/' + this.componentGroup + '/' + this.componentSlug;
		//this.componentRoot  = './' + ( this.sockConfig['installer-path'] || 'components/' ) + this.componentPath + '/';
	}

	/**-----------------------------------------------------------------------------
	 * ENDOF: setPaths
	 * -----------------------------------------------------------------------------*/


};


module.exports = new Vars();