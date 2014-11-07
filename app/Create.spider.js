/** =======================================================================================================================
 * HELPERS
 * ======================================================================================================================= */
/*jshint smarttabs: true */


// Private
var prompt = require('prompt');
var chalk = require('chalk');




module.exports = {

	init : function (){
		"use strict";

		var prompts = [
			{
				type       : 'string',
				name       : 'componentName',
				required: true,
				pattern: /^[A-Za-z0-9 :-_]*$/,
				description: chalk.magenta.bgBlack.bold('Gimme thy component\'s name. [A-Za-z0-9 :-_]')
			},

			{
				type       : 'string',
				name       : 'componentSlug',
				description: 'Gimme thy component\'s slug. [A-Za-z0-9-_]'
			},

			{
				type       : 'string',
				name       : 'componentGroup',
				description: 'Gimme thy component\'s functional group. [a-z0-9-_]'
			},

			{
				type       : 'list',
				name       : 'componentType',
				description: 'What type of component is it?',
				choices    : ['atom', 'molecule', 'organism', 'template', 'page'],
				default    : 'atom'
			},

			{
				type       : 'string',
				name       : 'componentDeps',
				description: 'Any git dependencies? (comma separated git repo URLs only)'
			},

			{
				type       : 'list',
				name       : 'componentJs',
				description: 'Create JS Module?',
				choices    : ['nope', 'yep'],
				default    : 'nope'
			},

			{
				when   : function (props) {
					return props.componentJs === 'yep';
				},
				name   : 'componentJsName',
				type   : 'string',
				description: 'OK then, so what\'s the filename of JS module?',
				default: function (props) {
					return props.componentSlug.replace(/[-_]+/g, ' ').
						       replace(
						/\b\w+/g, function (s) {
							return s.charAt(0).toUpperCase() + s.substr(1);
						}
					).
						       replace(/\s/g, '_') + '.js';
				}
			}

		];

		prompt.message = chalk.magenta.bgBlack.bold('[ spider ]');
		prompt.start();

		prompt.get(
			prompts,
			function (props) {
				this.componentName = props.componentName;
				this.componentSlug = sanitize(props.componentSlug.replace(/\s+/g, '-'));
				this.componentGroup = props.componentGroup;
				this.componentType = props.componentType;
				this.componentDeps = props.componentDeps;
				this.componentJs = props.componentJs;
				this.componentJsName = props.componentJsName;

				this.componentPath = this.componentType + 's/' + this.componentGroup + '/' + this.componentSlug;
				this.componentRoot = './' + ( this.sockConfig['installer-path'] || 'components/' ) + this.componentPath + '/';
				this.destinationRoot(this.componentRoot);

				done();
			}.bind(this)
		);
	}

};

