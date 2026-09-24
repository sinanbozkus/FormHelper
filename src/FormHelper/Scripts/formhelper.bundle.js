/*! FormHelper v6.0.0 | MIT License | https://github.com/sinanbozkus/FormHelper */
(function (define, module) {
var jQuery = window.jQuery;
if (!jQuery) {
  console.warn("FormHelper: jQuery was not found, so jQuery Validation in formhelper.bundle.js was skipped. Load jQuery before formhelper.bundle.js, or use formhelper.js.");
  return;
}
// jQuery 4 removed $.parseJSON, which Unobtrusive 4.0.0 still calls. It was JSON.parse.
if (!jQuery.parseJSON) {
  jQuery.parseJSON = JSON.parse;
}
// Skipped when the page already loads them (e.g. _ValidationScriptsPartial), so they are never loaded twice.
if (!jQuery.validator) {
/*!
 * jQuery Validation Plugin v1.22.1
 *
 * https://jqueryvalidation.org/
 *
 * Copyright (c) 2026 Jörn Zaefferer
 * Released under the MIT license
 */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		define( ["jquery"], factory );
	} else if (typeof module === "object" && module.exports) {
		module.exports = factory( require( "jquery" ) );
	} else {
		factory( jQuery );
	}
}(function( $ ) {

$.extend( $.fn, {

	// https://jqueryvalidation.org/validate/
	validate: function( options ) {

		// If nothing is selected, return nothing; can't chain anyway
		if ( !this.length ) {
			if ( options && options.debug && window.console ) {
				console.warn( "Nothing selected, can't validate, returning nothing." );
			}
			return;
		}

		// Check if a validator for this form was already created
		var validator = $.data( this[ 0 ], "validator" );
		if ( validator ) {
			return validator;
		}

		// Add novalidate tag if HTML5.
		this.attr( "novalidate", "novalidate" );

		validator = new $.validator( options, this[ 0 ] );
		$.data( this[ 0 ], "validator", validator );

		if ( validator.settings.onsubmit ) {

			this.on( "click.validate", ":submit", function( event ) {

				// Track the used submit button to properly handle scripted
				// submits later.
				validator.submitButton = event.currentTarget;

				// Allow suppressing validation by adding a cancel class to the submit button
				if ( $( this ).hasClass( "cancel" ) ) {
					validator.cancelSubmit = true;
				}

				// Allow suppressing validation by adding the html5 formnovalidate attribute to the submit button
				if ( $( this ).attr( "formnovalidate" ) !== undefined ) {
					validator.cancelSubmit = true;
				}
			} );

			// Validate the form on submit
			this.on( "submit.validate", function( event ) {
				if ( validator.settings.debug ) {

					// Prevent form submit to be able to see console output
					event.preventDefault();
				}

				function handle() {
					var hidden, result;

					// Insert a hidden input as a replacement for the missing submit button
					// The hidden input is inserted in two cases:
					//   - A user defined a `submitHandler`
					//   - There was a pending request due to `remote` method and `stopRequest()`
					//     was called to submit the form in case it's valid
					if ( validator.submitButton && ( validator.settings.submitHandler || validator.formSubmitted ) ) {
						hidden = $( "<input type='hidden'/>" )
							.attr( "name", validator.submitButton.name )
							.val( $( validator.submitButton ).val() )
							.appendTo( validator.currentForm );
					}

					if ( validator.settings.submitHandler && !validator.settings.debug ) {
						result = validator.settings.submitHandler.call( validator, validator.currentForm, event );
						if ( hidden ) {

							// And clean up afterwards; thanks to no-block-scope, hidden can be referenced
							hidden.remove();
						}
						if ( result !== undefined ) {
							return result;
						}
						return false;
					}
					return true;
				}

				// Prevent submit for invalid forms or custom submit handlers
				if ( validator.cancelSubmit ) {
					validator.cancelSubmit = false;
					return handle();
				}
				if ( validator.form() ) {
					if ( validator.pendingRequest ) {
						validator.formSubmitted = true;
						return false;
					}
					return handle();
				} else {
					validator.focusInvalid();
					return false;
				}
			} );
		}

		return validator;
	},

	// https://jqueryvalidation.org/valid/
	valid: function() {
		var valid, validator, errorList;

		if ( $( this[ 0 ] ).is( "form" ) ) {
			valid = this.validate().form();
		} else {
			errorList = [];
			valid = true;
			validator = $( this[ 0 ].form ).validate();
			this.each( function() {
				valid = validator.element( this ) && valid;
				if ( !valid ) {
					errorList = errorList.concat( validator.errorList );
				}
			} );
			validator.errorList = errorList;
		}
		return valid;
	},

	// https://jqueryvalidation.org/rules/
	rules: function( command, argument ) {
		var element = this[ 0 ],
			isContentEditable = typeof this.attr( "contenteditable" ) !== "undefined" && this.attr( "contenteditable" ) !== "false",
			settings, staticRules, existingRules, data, param, filtered;

		// If nothing is selected, return empty object; can't chain anyway
		if ( element == null ) {
			return;
		}

		if ( !element.form && isContentEditable ) {
			element.form = this.closest( "form" )[ 0 ];
			element.name = this.attr( "name" );
		}

		if ( element.form == null ) {
			return;
		}

		if ( command ) {
			settings = $.data( element.form, "validator" ).settings;
			staticRules = settings.rules;
			existingRules = $.validator.staticRules( element );
			switch ( command ) {
			case "add":
				$.extend( existingRules, $.validator.normalizeRule( argument ) );

				// Remove messages from rules, but allow them to be set separately
				delete existingRules.messages;
				staticRules[ element.name ] = existingRules;
				if ( argument.messages ) {
					settings.messages[ element.name ] = $.extend( settings.messages[ element.name ], argument.messages );
				}
				break;
			case "remove":
				if ( !argument ) {
					delete staticRules[ element.name ];
					return existingRules;
				}
				filtered = {};
				$.each( argument.split( /\s/ ), function( index, method ) {
					filtered[ method ] = existingRules[ method ];
					delete existingRules[ method ];
				} );
				return filtered;
			}
		}

		data = $.validator.normalizeRules(
		$.extend(
			{},
			$.validator.classRules( element ),
			$.validator.attributeRules( element ),
			$.validator.dataRules( element ),
			$.validator.staticRules( element )
		), element );

		// Make sure required is at front
		if ( data.required ) {
			param = data.required;
			delete data.required;
			data = $.extend( { required: param }, data );
		}

		// Make sure remote is at back
		if ( data.remote ) {
			param = data.remote;
			delete data.remote;
			data = $.extend( data, { remote: param } );
		}

		return data;
	}
} );

// JQuery trim is deprecated, provide a trim method based on String.prototype.trim
var trim = function( str ) {

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim#Polyfill
	return str.replace( /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "" );
};

// Custom selectors
$.extend( $.expr.pseudos || $.expr[ ":" ], {		// '|| $.expr[ ":" ]' here enables backwards compatibility to jQuery 1.7. Can be removed when dropping jQ 1.7.x support

	// https://jqueryvalidation.org/blank-selector/
	blank: function( a ) {
		return !trim( "" + $( a ).val() );
	},

	// https://jqueryvalidation.org/filled-selector/
	filled: function( a ) {
		var val = $( a ).val();
		return val !== null && !!trim( "" + val );
	},

	// https://jqueryvalidation.org/unchecked-selector/
	unchecked: function( a ) {
		return !$( a ).prop( "checked" );
	}
} );

// Constructor for validator
$.validator = function( options, form ) {
	this.settings = $.extend( true, {}, $.validator.defaults, options );
	this.currentForm = form;
	this.init();
};

// https://jqueryvalidation.org/jQuery.validator.format/
$.validator.format = function( source, params ) {
	if ( arguments.length === 1 ) {
		return function() {
			var args = $.makeArray( arguments );
			args.unshift( source );
			return $.validator.format.apply( this, args );
		};
	}
	if ( params === undefined ) {
		return source;
	}
	if ( arguments.length > 2 && params.constructor !== Array  ) {
		params = $.makeArray( arguments ).slice( 1 );
	}
	if ( params.constructor !== Array ) {
		params = [ params ];
	}
	$.each( params, function( i, n ) {
		source = source.replace( new RegExp( "\\{" + i + "\\}", "g" ), function() {
			return n;
		} );
	} );
	return source;
};

$.extend( $.validator, {

	defaults: {
		messages: {},
		groups: {},
		rules: {},
		errorClass: "error",
		pendingClass: "pending",
		validClass: "valid",
		errorElement: "label",
		focusCleanup: false,
		focusInvalid: true,
		ariaDescribedByCleanup: false,
		errorContainer: $( [] ),
		errorLabelContainer: $( [] ),
		onsubmit: true,
		ignore: ":hidden",
		ignoreTitle: false,
		customElements: [],
		onfocusin: function( element ) {
			this.lastActive = element;

			// Hide error label and remove error class on focus if enabled
			if ( this.settings.focusCleanup ) {
				if ( this.settings.unhighlight ) {
					this.settings.unhighlight.call( this, element, this.settings.errorClass, this.settings.validClass );
				}
				this.hideThese( this.errorsFor( element ) );
			}
		},
		onfocusout: function( element ) {
			if ( !this.checkable( element ) && ( element.name in this.submitted || !this.optional( element ) ) ) {
				this.element( element );
			}
		},
		onkeyup: function( element, event ) {

			// Avoid revalidate the field when pressing one of the following keys
			// Shift       => 16
			// Ctrl        => 17
			// Alt         => 18
			// Caps lock   => 20
			// End         => 35
			// Home        => 36
			// Left arrow  => 37
			// Up arrow    => 38
			// Right arrow => 39
			// Down arrow  => 40
			// Insert      => 45
			// Num lock    => 144
			// AltGr key   => 225
			var excludedKeys = [
				16, 17, 18, 20, 35, 36, 37,
				38, 39, 40, 45, 144, 225
			];

			if ( event.which === 9 && this.elementValue( element ) === "" || $.inArray( event.keyCode, excludedKeys ) !== -1 ) {
				return;
			} else if ( element.name in this.submitted || element.name in this.invalid ) {
				this.element( element );
			}
		},
		onclick: function( element ) {

			// Click on selects, radiobuttons and checkboxes
			if ( element.name in this.submitted ) {
				this.element( element );

			// Or option elements, check parent select in that case
			} else if ( element.parentNode.name in this.submitted ) {
				this.element( element.parentNode );
			}
		},
		highlight: function( element, errorClass, validClass ) {
			if ( element.type === "radio" ) {
				this.findByName( element.name ).addClass( errorClass ).removeClass( validClass );
			} else {
				$( element ).addClass( errorClass ).removeClass( validClass );
			}
		},
		unhighlight: function( element, errorClass, validClass ) {
			if ( element.type === "radio" ) {
				this.findByName( element.name ).removeClass( errorClass ).addClass( validClass );
			} else {
				$( element ).removeClass( errorClass ).addClass( validClass );
			}
		}
	},

	// https://jqueryvalidation.org/jQuery.validator.setDefaults/
	setDefaults: function( settings ) {
		$.extend( $.validator.defaults, settings );
	},

	messages: {
		required: "This field is required.",
		remote: "Please fix this field.",
		email: "Please enter a valid email address.",
		url: "Please enter a valid URL.",
		date: "Please enter a valid date.",
		dateISO: "Please enter a valid date (ISO).",
		number: "Please enter a valid number.",
		digits: "Please enter only digits.",
		equalTo: "Please enter the same value again.",
		maxlength: $.validator.format( "Please enter no more than {0} characters." ),
		minlength: $.validator.format( "Please enter at least {0} characters." ),
		rangelength: $.validator.format( "Please enter a value between {0} and {1} characters long." ),
		range: $.validator.format( "Please enter a value between {0} and {1}." ),
		max: $.validator.format( "Please enter a value less than or equal to {0}." ),
		min: $.validator.format( "Please enter a value greater than or equal to {0}." ),
		step: $.validator.format( "Please enter a multiple of {0}." )
	},

	autoCreateRanges: false,

	prototype: {

		init: function() {
			this.labelContainer = $( this.settings.errorLabelContainer );
			this.errorContext = this.labelContainer.length && this.labelContainer || $( this.currentForm );
			this.containers = $( this.settings.errorContainer ).add( this.settings.errorLabelContainer );
			this.submitted = {};
			this.valueCache = {};
			this.pendingRequest = 0;
			this.pending = {};
			this.invalid = {};
			this.reset();

			var currentForm = this.currentForm,
				groups = ( this.groups = {} ),
				rules;
			$.each( this.settings.groups, function( key, value ) {
				if ( typeof value === "string" ) {
					value = value.split( /\s/ );
				}
				$.each( value, function( index, name ) {
					groups[ name ] = key;
				} );
			} );
			rules = this.settings.rules;
			$.each( rules, function( key, value ) {
				rules[ key ] = $.validator.normalizeRule( value );
			} );

			function delegate( event ) {
				var isContentEditable = typeof $( this ).attr( "contenteditable" ) !== "undefined" && $( this ).attr( "contenteditable" ) !== "false";

				// Set form expando on contenteditable
				if ( !this.form && isContentEditable ) {
					this.form = $( this ).closest( "form" )[ 0 ];
					this.name = $( this ).attr( "name" );
				}

				// Ignore the element if it belongs to another form. This will happen mainly
				// when setting the `form` attribute of an input to the id of another form.
				if ( currentForm !== this.form ) {
					return;
				}

				var validator = $.data( this.form, "validator" ),
					eventType = "on" + event.type.replace( /^validate/, "" ),
					settings = validator.settings;
				if ( settings[ eventType ] && !$( this ).is( settings.ignore ) ) {
					settings[ eventType ].call( validator, this, event );
				}
			}
			var focusListeners = [ ":text", "[type='password']", "[type='file']", "select", "textarea", "[type='number']", "[type='search']",
								"[type='tel']", "[type='url']", "[type='email']", "[type='datetime']", "[type='date']", "[type='month']",
								"[type='week']", "[type='time']", "[type='datetime-local']", "[type='range']", "[type='color']",
								"[type='radio']", "[type='checkbox']", "[contenteditable]", "[type='button']" ];
			var clickListeners = [ "select", "option", "[type='radio']", "[type='checkbox']" ];
			$( this.currentForm )
				.on( "focusin.validate focusout.validate keyup.validate", focusListeners.concat( this.settings.customElements ).join( ", " ), delegate )

				// Support: Chrome, oldIE
				// "select" is provided as event.target when clicking a option
				.on( "click.validate", clickListeners.concat( this.settings.customElements ).join( ", " ), delegate );

			if ( this.settings.invalidHandler ) {
				$( this.currentForm ).on( "invalid-form.validate", this.settings.invalidHandler );
			}
		},

		// https://jqueryvalidation.org/Validator.form/
		form: function() {
			this.checkForm();
			$.extend( this.submitted, this.errorMap );
			this.invalid = $.extend( {}, this.errorMap );
			if ( !this.valid() ) {
				$( this.currentForm ).triggerHandler( "invalid-form", [ this ] );
			}
			this.showErrors();
			return this.valid();
		},

		checkForm: function() {
			this.prepareForm();
			for ( var i = 0, elements = ( this.currentElements = this.elements() ); elements[ i ]; i++ ) {
				this.check( elements[ i ] );
			}
			return this.valid();
		},

		// https://jqueryvalidation.org/Validator.element/
		element: function( element ) {
			var cleanElement = this.clean( element ),
				checkElement = this.validationTargetFor( cleanElement ),
				v = this,
				result = true,
				rs, group;

			if ( checkElement === undefined ) {
				delete this.invalid[ cleanElement.name ];
			} else {
				this.prepareElement( checkElement );
				this.currentElements = $( checkElement );

				// If this element is grouped, then validate all group elements already
				// containing a value
				group = this.groups[ checkElement.name ];
				if ( group ) {
					$.each( this.groups, function( name, testgroup ) {
						if ( testgroup === group && name !== checkElement.name ) {
							cleanElement = v.validationTargetFor( v.clean( v.findByName( name ) ) );

							// Don't want to check fields if a user hasn't gotten to them yet
							if ( cleanElement && cleanElement.name in v.invalid ) {
								v.currentElements.pushStack( cleanElement );
								result = v.check( cleanElement ) && result;
							}
						}
					} );
				}

				rs = this.check( checkElement ) !== false;
				result = result && rs;
				if ( rs ) {
					this.invalid[ checkElement.name ] = false;
				} else {
					this.invalid[ checkElement.name ] = true;
				}

				if ( !this.numberOfInvalids() ) {

					// Hide error containers on last error
					this.toHide = this.toHide.add( this.containers );
				}
				this.showErrors();

				// Add aria-invalid status for screen readers
				$( element ).attr( "aria-invalid", !rs );
			}

			return result;
		},

		// https://jqueryvalidation.org/Validator.showErrors/
		showErrors: function( errors ) {
			if ( errors ) {
				var validator = this;

				// Add items to error list and map
				$.extend( this.errorMap, errors );
				this.errorList = $.map( this.errorMap, function( message, name ) {
					return {
						message: message,
						element: validator.findByName( name )[ 0 ]
					};
				} );

				// Remove items from success list
				this.successList = $.grep( this.successList, function( element ) {
					return !( element.name in errors );
				} );
			}
			if ( this.settings.showErrors ) {
				this.settings.showErrors.call( this, this.errorMap, this.errorList );
			} else {
				this.defaultShowErrors();
			}
		},

		// https://jqueryvalidation.org/Validator.resetForm/
		resetForm: function() {
			if ( $.fn.resetForm ) {
				$( this.currentForm ).resetForm();
			}
			this.invalid = {};
			this.submitted = {};
			this.prepareForm();
			this.hideErrors();
			var elements = this.elements()
				.removeData( "previousValue" )
				.removeAttr( "aria-invalid" );

			this.resetElements( elements );
		},

		resetElements: function( elements ) {
			var i;

			if ( this.settings.unhighlight ) {
				for ( i = 0; elements[ i ]; i++ ) {
					this.settings.unhighlight.call( this, elements[ i ],
						this.settings.errorClass, "" );
					this.findByName( elements[ i ].name ).removeClass( this.settings.validClass );
				}
			} else {
				elements
					.removeClass( this.settings.errorClass )
					.removeClass( this.settings.validClass );
			}
		},

		numberOfInvalids: function() {
			return this.objectLength( this.invalid );
		},

		objectLength: function( obj ) {
			/* jshint unused: false */
			var count = 0,
				i;
			for ( i in obj ) {

				// This check allows counting elements with empty error
				// message as invalid elements
				if ( obj[ i ] !== undefined && obj[ i ] !== null && obj[ i ] !== false ) {
					count++;
				}
			}
			return count;
		},

		hideErrors: function() {
			this.hideThese( this.toHide );
		},
		addErrorAriaDescribedBy: function( element, error, updateGroupMembers ) {
			updateGroupMembers = ( updateGroupMembers === undefined ) ? false : updateGroupMembers;

			var errorID, v, group,
				describedBy = $( element ).attr( "aria-describedby" );
				errorID = error.attr( "id" );

			// Respect existing non-error aria-describedby
			if ( !describedBy ) {
				describedBy = errorID;
			} else if ( !describedBy.match( new RegExp( "\\b" + this.escapeCssMeta( errorID ) + "\\b" ) ) ) {

				// Add to end of list if not already present
				describedBy += " " + errorID;
			}

			$( element ).attr( "aria-describedby", describedBy );

			if ( updateGroupMembers ) {

				// If this element is grouped, then assign to all elements in the same group
				group = this.groups[ element.name ];
				if ( group ) {
					v = this;
					$.each( v.groups, function( name, testgroup ) {
						if ( testgroup === group ) {
							v.addErrorAriaDescribedBy( $( "[name='" + v.escapeCssMeta( name ) + "']", v.currentForm ), error, false );
						}
					} );
				}
			}
		},

		removeErrorAriaDescribedBy: function( element, error ) {

			var describedBy = $( element ).attr( "aria-describedby" ),
				describedByIds = describedBy.split( " " ),
				errorID = error.attr( "id" ),
				ind = describedByIds.indexOf( errorID );

			if ( ind > -1 ) {
				describedByIds.splice( ind, 1 );
			}

			if ( describedByIds.length ) {
				$( element ).attr( "aria-describedby", describedByIds.join( " " ) );
			} else {
				$( element ).removeAttr( "aria-describedby" );
			}

		},

		hideThese: function( errors ) {

			for ( var i = 0; errors[ i ]; i++ ) {
				var error = $( errors[ i ] ),
					errorID = error.attr( "id" ) ? this.escapeCssMeta( error.attr( "id" ) ) : undefined,
					element = ( errorID ) ? this.elements().filter( '[aria-describedby~="' + errorID + '"]' ) : [];

				if ( this.settings.ariaDescribedByCleanup && element.length ) {
					this.removeErrorAriaDescribedBy( element, error );
				}

				if ( !error.is( this.containers ) ) {
					error.text( "" );
				}

				this.addWrapper( error ).hide();
			}

		},

		valid: function() {
			return this.size() === 0;
		},

		size: function() {
			return this.errorList.length;
		},

		focusInvalid: function() {
			if ( this.settings.focusInvalid ) {
				try {
					$( this.findLastActive() || this.errorList.length && this.errorList[ 0 ].element || [] )
					.filter( ":visible" )
					.trigger( "focus" )

					// Manually trigger focusin event; without it, focusin handler isn't called, findLastActive won't have anything to find
					.trigger( "focusin" );
				} catch ( e ) {

					// Ignore IE throwing errors when focusing hidden elements
				}
			}
		},

		findLastActive: function() {
			var lastActive = this.lastActive;
			return lastActive && $.grep( this.errorList, function( n ) {
				return n.element.name === lastActive.name;
			} ).length === 1 && lastActive;
		},

		elements: function() {
			var validator = this,
				rulesCache = {},
				selectors = [ "input", "select", "textarea", "[contenteditable]" ],
				formId = this.currentForm.getAttribute( "id" ),
				elements;

			// Select all valid inputs inside the form (no submit or reset buttons)
			elements = $( this.currentForm )
			.find( selectors.concat( this.settings.customElements ).join( ", " ) )
			.not( ":submit, :reset, :image, :disabled" )
			.not( this.settings.ignore );

			// If the form has an ID, also include elements outside the form that have
			// a form attribute pointing to this form
			if ( formId ) {
				elements = elements.add(
					$( selectors.concat( this.settings.customElements ).join( ", " ) )
					.filter( "[form='" + validator.escapeCssMeta( formId ) + "']" )
					.not( ":submit, :reset, :image, :disabled" )
					.not( this.settings.ignore )
				);
			}

			return elements.filter( function() {
				var name = this.name || $( this ).attr( "name" ); // For contenteditable
				var isContentEditable = typeof $( this ).attr( "contenteditable" ) !== "undefined" && $( this ).attr( "contenteditable" ) !== "false";

				if ( !name && validator.settings.debug && window.console ) {
					console.error( "%o has no name assigned", this );
				}

				// Set form expando on contenteditable
				if ( isContentEditable ) {
					this.form = $( this ).closest( "form" )[ 0 ];
					this.name = name;
				}

				// Ignore elements that belong to other/nested forms
				if ( this.form !== validator.currentForm ) {
					return false;
				}

				// Select only the first element for each name, and only those with rules specified
				if ( name in rulesCache || !validator.objectLength( $( this ).rules() ) ) {
					return false;
				}

				rulesCache[ name ] = true;
				return true;
			} );
		},

		clean: function( selector ) {
			return $( selector )[ 0 ];
		},

		errors: function() {
			var errorClass = this.settings.errorClass.split( " " ).join( "." );
			return $( this.settings.errorElement + "." + errorClass, this.errorContext );
		},

		resetInternals: function() {
			this.successList = [];
			this.errorList = [];
			this.errorMap = {};
			this.toShow = $( [] );
			this.toHide = $( [] );
		},

		reset: function() {
			this.resetInternals();
			this.currentElements = $( [] );
		},

		prepareForm: function() {
			this.reset();
			this.toHide = this.errors().add( this.containers );
		},

		prepareElement: function( element ) {
			this.reset();
			this.toHide = this.errorsFor( element );
		},

		elementValue: function( element ) {
			var $element = $( element ),
				type = element.type,
				isContentEditable = typeof $element.attr( "contenteditable" ) !== "undefined" && $element.attr( "contenteditable" ) !== "false",
				val, idx;

			if ( type === "radio" || type === "checkbox" ) {
				return this.findByName( element.name ).filter( ":checked" ).val();
			} else if ( type === "number" && typeof element.validity !== "undefined" ) {
				return element.validity.badInput ? "NaN" : $element.val();
			}

			if ( isContentEditable ) {
				val = $element.text();
			} else {
				val = $element.val();
			}

			if ( type === "file" ) {

				// Modern browser (chrome & safari)
				if ( val.substr( 0, 12 ) === "C:\\fakepath\\" ) {
					return val.substr( 12 );
				}

				// Legacy browsers
				// Unix-based path
				idx = val.lastIndexOf( "/" );
				if ( idx >= 0 ) {
					return val.substr( idx + 1 );
				}

				// Windows-based path
				idx = val.lastIndexOf( "\\" );
				if ( idx >= 0 ) {
					return val.substr( idx + 1 );
				}

				// Just the file name
				return val;
			}

			if ( typeof val === "string" ) {
				return val.replace( /\r/g, "" );
			}
			return val;
		},

		check: function( element ) {
			element = this.validationTargetFor( this.clean( element ) );

			var rules = $( element ).rules(),
				rulesCount = $.map( rules, function( n, i ) {
					return i;
				} ).length,
				dependencyMismatch = false,
				val = this.elementValue( element ),
				result, method, rule, normalizer;

			// Abort any pending Ajax request from a previous call to this method.
			this.abortRequest( element );

			// Prioritize the local normalizer defined for this element over the global one
			// if the former exists, otherwise user the global one in case it exists.
			if ( typeof rules.normalizer === "function" ) {
				normalizer = rules.normalizer;
			} else if (	typeof this.settings.normalizer === "function" ) {
				normalizer = this.settings.normalizer;
			}

			// If normalizer is defined, then call it to retreive the changed value instead
			// of using the real one.
			// Note that `this` in the normalizer is `element`.
			if ( normalizer ) {
				val = normalizer.call( element, val );

				// Delete the normalizer from rules to avoid treating it as a pre-defined method.
				delete rules.normalizer;
			}

			for ( method in rules ) {
				rule = { method: method, parameters: rules[ method ] };
				try {
					result = $.validator.methods[ method ].call( this, val, element, rule.parameters );

					// If a method indicates that the field is optional and therefore valid,
					// don't mark it as valid when there are no other rules
					if ( result === "dependency-mismatch" && rulesCount === 1 ) {
						dependencyMismatch = true;
						continue;
					}
					dependencyMismatch = false;

					if ( result === "pending" ) {
						this.toHide = this.toHide.not( this.errorsFor( element ) );
						return;
					}

					if ( !result ) {
						this.formatAndAdd( element, rule );
						return false;
					}
				} catch ( e ) {
					if ( this.settings.debug && window.console ) {
						console.log( "Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.", e );
					}
					if ( e instanceof TypeError ) {
						e.message += ".  Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.";
					}

					throw e;
				}
			}
			if ( dependencyMismatch ) {
				return;
			}
			if ( this.objectLength( rules ) ) {
				this.successList.push( element );
			}
			return true;
		},

		// Return the custom message for the given element and validation method
		// specified in the element's HTML5 data attribute
		// return the generic message if present and no method specific message is present
		customDataMessage: function( element, method ) {
			return $( element ).data( "msg" + method.charAt( 0 ).toUpperCase() +
				method.substring( 1 ).toLowerCase() ) || $( element ).data( "msg" );
		},

		// Return the custom message for the given element name and validation method
		customMessage: function( name, method ) {
			var m = this.settings.messages[ name ];
			return m && ( m.constructor === String ? m : m[ method ] );
		},

		// Return the first defined argument, allowing empty strings
		findDefined: function() {
			for ( var i = 0; i < arguments.length; i++ ) {
				if ( arguments[ i ] !== undefined ) {
					return arguments[ i ];
				}
			}
			return undefined;
		},

		// The second parameter 'rule' used to be a string, and extended to an object literal
		// of the following form:
		// rule = {
		//     method: "method name",
		//     parameters: "the given method parameters"
		// }
		//
		// The old behavior still supported, kept to maintain backward compatibility with
		// old code, and will be removed in the next major release.
		defaultMessage: function( element, rule ) {
			if ( typeof rule === "string" ) {
				rule = { method: rule };
			}

			var message = this.findDefined(
					this.customMessage( element.name, rule.method ),
					this.customDataMessage( element, rule.method ),

					// 'title' is never undefined, so handle empty string as undefined
					!this.settings.ignoreTitle && element.title || undefined,
					$.validator.messages[ rule.method ],
					"<strong>Warning: No message defined for " + element.name + "</strong>"
				),
				theregex = /\$?\{(\d+)\}/g;
			if ( typeof message === "function" ) {
				message = message.call( this, rule.parameters, element );
			} else if ( theregex.test( message ) ) {
				message = $.validator.format( message.replace( theregex, "{$1}" ), rule.parameters );
			}

			return message;
		},

		formatAndAdd: function( element, rule ) {
			var message = this.defaultMessage( element, rule );

			this.errorList.push( {
				message: message,
				element: element,
				method: rule.method
			} );

			this.errorMap[ element.name ] = message;
			this.submitted[ element.name ] = message;
		},

		addWrapper: function( toToggle ) {
			if ( this.settings.wrapper ) {
				toToggle = toToggle.add( toToggle.parent( this.settings.wrapper ) );
			}
			return toToggle;
		},

		defaultShowErrors: function() {
			var i, elements, error;

			for ( i = 0; this.errorList[ i ]; i++ ) {
				error = this.errorList[ i ];
				if ( this.settings.highlight ) {
					this.settings.highlight.call( this, error.element, this.settings.errorClass, this.settings.validClass );
				}
				this.showLabel( error.element, error.message );
			}

			if ( this.errorList.length ) {
				this.toShow = this.toShow.add( this.containers );
			}

			if ( this.settings.success ) {
				for ( i = 0; this.successList[ i ]; i++ ) {
					this.showLabel( this.successList[ i ] );
				}
			}

			if ( this.settings.unhighlight ) {
				for ( i = 0, elements = this.validElements(); elements[ i ]; i++ ) {
					this.settings.unhighlight.call( this, elements[ i ], this.settings.errorClass, this.settings.validClass );
				}
			}

			this.toHide = this.toHide.not( this.toShow );
			this.hideErrors();
			this.addWrapper( this.toShow ).show();
		},

		validElements: function() {
			return this.currentElements.not( this.invalidElements() );
		},

		invalidElements: function() {
			return $( this.errorList ).map( function() {
				return this.element;
			} );
		},

		showLabel: function( element, message ) {
			var place,
				error = this.errorsFor( element ),
				elementID = this.idOrName( element ),
				describedBy = $( element ).attr( "aria-describedby" );

			if ( error.length ) {

				// Non-label error exists but is not currently associated with element via aria-describedby
				if ( error.closest( "label[for='" + this.escapeCssMeta( elementID ) + "']" ).length === 0 && ( describedBy === undefined || describedBy.split( " " ).indexOf( error.attr( "id" ) ) === -1 ) ) {
					this.addErrorAriaDescribedBy( element, error, true );
				}

				// Refresh error/success class
				error.removeClass( this.settings.validClass ).addClass( this.settings.errorClass );

				// Replace message on existing label
				if ( this.settings && this.settings.escapeHtml ) {
					error.text( message || "" );
				} else {
					error.html( message || "" );
				}
			} else {

				// Create error element
				error = $( "<" + this.settings.errorElement + ">" )
					.attr( "id", elementID + "-error" )
					.addClass( this.settings.errorClass );

				if ( this.settings && this.settings.escapeHtml ) {
					error.text( message || "" );
				} else {
					error.html( message || "" );
				}

				// Maintain reference to the element to be placed into the DOM
				place = error;
				if ( this.settings.wrapper ) {

					// Make sure the element is visible, even in IE
					// actually showing the wrapped element is handled elsewhere
					place = error.hide().show().wrap( "<" + this.settings.wrapper + "/>" ).parent();
				}
				if ( this.labelContainer.length ) {
					this.labelContainer.append( place );
				} else if ( this.settings.errorPlacement ) {
					this.settings.errorPlacement.call( this, place, $( element ) );
				} else {
					place.insertAfter( element );
				}

				// Link error back to the element
				if ( error.is( "label" ) ) {

					// If the error is a label, then associate using 'for'
					error.attr( "for", elementID );

				// If the element is not a child of an associated label, then it's necessary
				// to explicitly apply aria-describedby
				} else if ( error.parents( "label[for='" + this.escapeCssMeta( elementID ) + "']" ).length === 0 ) {
					this.addErrorAriaDescribedBy( element, error, true );
				}
			}
			if ( !message && this.settings.success ) {
				error.text( "" );
				if ( typeof this.settings.success === "string" ) {
					error.addClass( this.settings.success );
				} else {
					this.settings.success( error, element );
				}
			}
			this.toShow = this.toShow.add( error );
		},

		errorsFor: function( element ) {
			var name = this.escapeCssMeta( this.idOrName( element ) ),
				describer = $( element ).attr( "aria-describedby" ),
				selector = "label[for='" + name + "'], label[for='" + name + "'] *";

			// 'aria-describedby' should directly reference the error element
			if ( describer ) {
				selector = selector + ", #" + this.escapeCssMeta( describer )
					.replace( /\s+/g, ", #" );
			}

			// There may be hidden error elements not currently associated via aria-describedby (if ariaDescribedByCleanup is true)
			selector = selector + ", #" + name + "-error";

			return this
				.errors()
				.filter( selector );
		},

		// See https://api.jquery.com/category/selectors/, for CSS
		// meta-characters that should be escaped in order to be used with JQuery
		// as a literal part of a name/id or any selector.
		escapeCssMeta: function( string ) {
			if ( string === undefined ) {
				return "";
			}

			return string.replace( /([\\!"#$%&'()*+,./:;<=>?@\[\]^`{|}~])/g, "\\$1" );
		},

		idOrName: function( element ) {
			return this.groups[ element.name ] || ( this.checkable( element ) ? element.name : element.id || element.name );
		},

		validationTargetFor: function( element ) {

			// If radio/checkbox, validate first element in group instead
			if ( this.checkable( element ) ) {
				element = this.findByName( element.name );
			}

			// Always apply ignore filter
			return $( element ).not( this.settings.ignore )[ 0 ];
		},

		checkable: function( element ) {
			return ( /radio|checkbox/i ).test( element.type );
		},

		findByName: function( name ) {
			var formId = this.currentForm.getAttribute( "id" ),
				selector = "[name='" + this.escapeCssMeta( name ) + "']",
				elements = $( this.currentForm ).find( selector );

			// If the form has an ID, also include elements outside the form that have
			// a form attribute pointing to this form
			if ( formId ) {
				elements = elements.add(
					$( selector )
					.filter( "[form='" + this.escapeCssMeta( formId ) + "']" )
				);
			}

			return elements;
		},

		getLength: function( value, element ) {
			switch ( element.nodeName.toLowerCase() ) {
			case "select":
				return $( "option:selected", element ).length;
			case "input":
				if ( this.checkable( element ) ) {
					return this.findByName( element.name ).filter( ":checked" ).length;
				}
			}
			return value.length;
		},

		depend: function( param, element ) {
			return this.dependTypes[ typeof param ] ? this.dependTypes[ typeof param ]( param, element ) : true;
		},

		dependTypes: {
			"boolean": function( param ) {
				return param;
			},
			"string": function( param, element ) {
				return !!$( param, element.form ).length;
			},
			"function": function( param, element ) {
				return param( element );
			}
		},

		optional: function( element ) {
			var val = this.elementValue( element );
			return !$.validator.methods.required.call( this, val, element ) && "dependency-mismatch";
		},

		elementAjaxPort: function( element ) {
			return "validate" + element.name;
		},

		startRequest: function( element ) {
			if ( !this.pending[ element.name ] ) {
				this.pendingRequest++;
				$( element ).addClass( this.settings.pendingClass );
				this.pending[ element.name ] = true;
			}
		},

		stopRequest: function( element, valid ) {
			this.pendingRequest--;

			// Sometimes synchronization fails, make sure pendingRequest is never < 0
			if ( this.pendingRequest < 0 ) {
				this.pendingRequest = 0;
			}
			delete this.pending[ element.name ];
			$( element ).removeClass( this.settings.pendingClass );
			if ( valid && this.pendingRequest === 0 && this.formSubmitted && this.form() && this.pendingRequest === 0 ) {
				$( this.currentForm ).trigger( "submit" );

				// Remove the hidden input that was used as a replacement for the
				// missing submit button. The hidden input is added by `handle()`
				// to ensure that the value of the used submit button is passed on
				// for scripted submits triggered by this method
				if ( this.submitButton ) {
					$( "input:hidden[name='" + this.submitButton.name + "']", this.currentForm ).remove();
				}

				this.formSubmitted = false;
			} else if ( !valid && this.pendingRequest === 0 && this.formSubmitted ) {
				$( this.currentForm ).triggerHandler( "invalid-form", [ this ] );
				this.formSubmitted = false;
			}
		},

		abortRequest: function( element ) {
			var port;

			if ( this.pending[ element.name ] ) {
				port = this.elementAjaxPort( element );
				$.ajaxAbort( port );

				this.pendingRequest--;

				// Sometimes synchronization fails, make sure pendingRequest is never < 0
				if ( this.pendingRequest < 0 ) {
					this.pendingRequest = 0;
				}

				delete this.pending[ element.name ];
				$( element ).removeClass( this.settings.pendingClass );
			}
		},

		previousValue: function( element, method ) {
			method = typeof method === "string" && method || "remote";

			return $.data( element, "previousValue" ) || $.data( element, "previousValue", {
				old: null,
				valid: true,
				message: this.defaultMessage( element, { method: method } )
			} );
		},

		// Cleans up all forms and elements, removes validator-specific events
		destroy: function() {
			this.resetForm();

			$( this.currentForm )
				.off( ".validate" )
				.removeData( "validator" )
				.find( ".validate-equalTo-blur" )
					.off( ".validate-equalTo" )
					.removeClass( "validate-equalTo-blur" )
				.find( ".validate-lessThan-blur" )
					.off( ".validate-lessThan" )
					.removeClass( "validate-lessThan-blur" )
				.find( ".validate-lessThanEqual-blur" )
					.off( ".validate-lessThanEqual" )
					.removeClass( "validate-lessThanEqual-blur" )
				.find( ".validate-greaterThanEqual-blur" )
					.off( ".validate-greaterThanEqual" )
					.removeClass( "validate-greaterThanEqual-blur" )
				.find( ".validate-greaterThan-blur" )
					.off( ".validate-greaterThan" )
					.removeClass( "validate-greaterThan-blur" );
		}

	},

	classRuleSettings: {
		required: { required: true },
		email: { email: true },
		url: { url: true },
		date: { date: true },
		dateISO: { dateISO: true },
		number: { number: true },
		digits: { digits: true },
		creditcard: { creditcard: true }
	},

	addClassRules: function( className, rules ) {
		if ( className.constructor === String ) {
			this.classRuleSettings[ className ] = rules;
		} else {
			$.extend( this.classRuleSettings, className );
		}
	},

	classRules: function( element ) {
		var rules = {},
			classes = $( element ).attr( "class" );

		if ( classes ) {
			$.each( classes.split( " " ), function() {
				if ( this in $.validator.classRuleSettings ) {
					$.extend( rules, $.validator.classRuleSettings[ this ] );
				}
			} );
		}
		return rules;
	},

	normalizeAttributeRule: function( rules, type, method, value ) {

		// Convert the value to a number for number inputs, and for text for backwards compability
		// allows type="date" and others to be compared as strings
		if ( /min|max|step/.test( method ) && ( type === null || /number|range|text/.test( type ) ) ) {
			value = Number( value );

			// Support Opera Mini, which returns NaN for undefined minlength
			if ( isNaN( value ) ) {
				value = undefined;
			}
		}

		if ( value || value === 0 ) {
			rules[ method ] = value;
		} else if ( type === method && type !== "range" ) {

			// Exception: the jquery validate 'range' method
			// does not test for the html5 'range' type
			rules[ type === "date" ? "dateISO" : method ] = true;
		}
	},

	attributeRules: function( element ) {
		var rules = {},
			$element = $( element ),
			type = element.getAttribute( "type" ),
			method, value;

		for ( method in $.validator.methods ) {

			// Support for <input required> in both html5 and older browsers
			if ( method === "required" ) {
				value = element.getAttribute( method );

				// Some browsers return an empty string for the required attribute
				// and non-HTML5 browsers might have required="" markup
				if ( value === "" ) {
					value = true;
				}

				// Force non-HTML5 browsers to return bool
				value = !!value;
			} else {
				value = $element.attr( method );
			}

			this.normalizeAttributeRule( rules, type, method, value );
		}

		// 'maxlength' may be returned as -1, 2147483647 ( IE ) and 524288 ( safari ) for text inputs
		if ( rules.maxlength && /-1|2147483647|524288/.test( rules.maxlength ) ) {
			delete rules.maxlength;
		}

		return rules;
	},

	dataRules: function( element ) {
		var rules = {},
			$element = $( element ),
			type = element.getAttribute( "type" ),
			method, value;

		for ( method in $.validator.methods ) {
			value = $element.data( "rule" + method.charAt( 0 ).toUpperCase() + method.substring( 1 ).toLowerCase() );

			// Cast empty attributes like `data-rule-required` to `true`
			if ( value === "" ) {
				value = true;
			}

			this.normalizeAttributeRule( rules, type, method, value );
		}
		return rules;
	},

	staticRules: function( element ) {
		var rules = {},
			validator = $.data( element.form, "validator" );

		if ( validator.settings.rules ) {
			rules = $.validator.normalizeRule( validator.settings.rules[ element.name ] ) || {};
		}
		return rules;
	},

	normalizeRules: function( rules, element ) {

		// Handle dependency check
		$.each( rules, function( prop, val ) {

			// Ignore rule when param is explicitly false, eg. required:false
			if ( val === false ) {
				delete rules[ prop ];
				return;
			}
			if ( val.param || val.depends ) {
				var keepRule = true;
				switch ( typeof val.depends ) {
				case "string":
					keepRule = !!$( val.depends, element.form ).length;
					break;
				case "function":
					keepRule = val.depends.call( element, element );
					break;
				}
				if ( keepRule ) {
					rules[ prop ] = val.param !== undefined ? val.param : true;
				} else {
					$.data( element.form, "validator" ).resetElements( $( element ) );
					delete rules[ prop ];
				}
			}
		} );

		// Evaluate parameters
		$.each( rules, function( rule, parameter ) {
			rules[ rule ] = typeof parameter === "function" && rule !== "normalizer" ? parameter( element ) : parameter;
		} );

		// Clean number parameters
		$.each( [ "minlength", "maxlength" ], function() {
			if ( rules[ this ] ) {
				rules[ this ] = Number( rules[ this ] );
			}
		} );
		$.each( [ "rangelength", "range" ], function() {
			var parts;
			if ( rules[ this ] ) {
				if ( Array.isArray( rules[ this ] ) ) {
					rules[ this ] = [ Number( rules[ this ][ 0 ] ), Number( rules[ this ][ 1 ] ) ];
				} else if ( typeof rules[ this ] === "string" ) {
					parts = rules[ this ].replace( /[\[\]]/g, "" ).split( /[\s,]+/ );
					rules[ this ] = [ Number( parts[ 0 ] ), Number( parts[ 1 ] ) ];
				}
			}
		} );

		if ( $.validator.autoCreateRanges ) {

			// Auto-create ranges
			if ( rules.min != null && rules.max != null ) {
				rules.range = [ rules.min, rules.max ];
				delete rules.min;
				delete rules.max;
			}
			if ( rules.minlength != null && rules.maxlength != null ) {
				rules.rangelength = [ rules.minlength, rules.maxlength ];
				delete rules.minlength;
				delete rules.maxlength;
			}
		}

		return rules;
	},

	// Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
	normalizeRule: function( data ) {
		if ( typeof data === "string" ) {
			var transformed = {};
			$.each( data.split( /\s/ ), function() {
				transformed[ this ] = true;
			} );
			data = transformed;
		}
		return data;
	},

	// https://jqueryvalidation.org/jQuery.validator.addMethod/
	addMethod: function( name, method, message ) {
		$.validator.methods[ name ] = method;
		$.validator.messages[ name ] = message !== undefined ? message : $.validator.messages[ name ];
		if ( method.length < 3 ) {
			$.validator.addClassRules( name, $.validator.normalizeRule( name ) );
		}
	},

	// https://jqueryvalidation.org/jQuery.validator.methods/
	methods: {

		// https://jqueryvalidation.org/required-method/
		required: function( value, element, param ) {

			// Check if dependency is met
			if ( !this.depend( param, element ) ) {
				return "dependency-mismatch";
			}
			if ( element.nodeName.toLowerCase() === "select" ) {

				// Could be an array for select-multiple or a string, both are fine this way
				var val = $( element ).val();
				return val && val.length > 0;
			}
			if ( this.checkable( element ) ) {
				return this.getLength( value, element ) > 0;
			}
			return value !== undefined && value !== null && value.length > 0;
		},

		// https://jqueryvalidation.org/email-method/
		email: function( value, element ) {

			// From https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
			// Retrieved 2014-01-14
			// If you have a problem with this implementation, report a bug against the above spec
			// Or use custom methods to implement your own email validation
			return this.optional( element ) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test( value );
		},

		// https://jqueryvalidation.org/url-method/
		url: function( value, element ) {

			// Copyright (c) 2010-2013 Diego Perini, MIT licensed
			// https://gist.github.com/dperini/729294
			// see also https://mathiasbynens.be/demo/url-regex
			// modified to allow protocol-relative URLs
			return this.optional( element ) || /^(?:(?:(?:https?|ftp):)?\/\/)(?:(?:[^\]\[?\/<~#`!@$^&*()+=}|:";',>{ ]|%[0-9A-Fa-f]{2})+(?::(?:[^\]\[?\/<~#`!@$^&*()+=}|:";',>{ ]|%[0-9A-Fa-f]{2})*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test( value );
		},

		// https://jqueryvalidation.org/date-method/
		date: ( function() {
			var called = false;

			return function( value, element ) {
				if ( !called ) {
					called = true;
					if ( this.settings.debug && window.console ) {
						console.warn(
							"The `date` method is deprecated and will be removed in version '2.0.0'.\n" +
							"Please don't use it, since it relies on the Date constructor, which\n" +
							"behaves very differently across browsers and locales. Use `dateISO`\n" +
							"instead or one of the locale specific methods in `localizations/`\n" +
							"and `additional-methods.js`."
						);
					}
				}

				return this.optional( element ) || !/Invalid|NaN/.test( new Date( value ).toString() );
			};
		}() ),

		// https://jqueryvalidation.org/dateISO-method/
		dateISO: function( value, element ) {
			return this.optional( element ) || /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test( value );
		},

		// https://jqueryvalidation.org/number-method/
		number: function( value, element ) {
			return this.optional( element ) || /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:-?\.\d+)?$/.test( value );
		},

		// https://jqueryvalidation.org/digits-method/
		digits: function( value, element ) {
			return this.optional( element ) || /^\d+$/.test( value );
		},

		// https://jqueryvalidation.org/minlength-method/
		minlength: function( value, element, param ) {
			var length = Array.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || length >= param;
		},

		// https://jqueryvalidation.org/maxlength-method/
		maxlength: function( value, element, param ) {
			var length = Array.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || length <= param;
		},

		// https://jqueryvalidation.org/rangelength-method/
		rangelength: function( value, element, param ) {
			var length = Array.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || ( length >= param[ 0 ] && length <= param[ 1 ] );
		},

		// https://jqueryvalidation.org/min-method/
		min: function( value, element, param ) {
			return this.optional( element ) || value >= param;
		},

		// https://jqueryvalidation.org/max-method/
		max: function( value, element, param ) {
			return this.optional( element ) || value <= param;
		},

		// https://jqueryvalidation.org/range-method/
		range: function( value, element, param ) {
			return this.optional( element ) || ( value >= param[ 0 ] && value <= param[ 1 ] );
		},

		// https://jqueryvalidation.org/step-method/
		step: function( value, element, param ) {
			var type = $( element ).attr( "type" ),
				errorMessage = "Step attribute on input type " + type + " is not supported.",
				supportedTypes = [ "text", "number", "range" ],
				re = new RegExp( "\\b" + type + "\\b" ),
				notSupported = type && !re.test( supportedTypes.join() ),
				decimalPlaces = function( num ) {
					var match = ( "" + num ).match( /(?:\.(\d+))?$/ );
					if ( !match ) {
						return 0;
					}

					// Number of digits right of decimal point.
					return match[ 1 ] ? match[ 1 ].length : 0;
				},
				toInt = function( num ) {
					return Math.round( num * Math.pow( 10, decimals ) );
				},
				valid = true,
				decimals;

			// Works only for text, number and range input types
			// TODO find a way to support input types date, datetime, datetime-local, month, time and week
			if ( notSupported ) {
				throw new Error( errorMessage );
			}

			decimals = decimalPlaces( param );

			// Value can't have too many decimals
			if ( decimalPlaces( value ) > decimals || toInt( value ) % toInt( param ) !== 0 ) {
				valid = false;
			}

			return this.optional( element ) || valid;
		},

		// https://jqueryvalidation.org/equalTo-method/
		equalTo: function( value, element, param ) {

			// Bind to the blur event of the target in order to revalidate whenever the target field is updated
			var target = $( param );
			if ( this.settings.onfocusout && target.not( ".validate-equalTo-blur" ).length ) {
				target.addClass( "validate-equalTo-blur" ).on( "blur.validate-equalTo", function() {
					$( element ).valid();
				} );
			}
			return value === target.val();
		},

		// https://jqueryvalidation.org/remote-method/
		remote: function( value, element, param, method ) {
			if ( this.optional( element ) ) {
				return "dependency-mismatch";
			}

			method = typeof method === "string" && method || "remote";

			var previous = this.previousValue( element, method ),
				validator, data, optionDataString;

			if ( !this.settings.messages[ element.name ] ) {
				this.settings.messages[ element.name ] = {};
			}
			previous.originalMessage = previous.originalMessage || this.settings.messages[ element.name ][ method ];
			this.settings.messages[ element.name ][ method ] = previous.message;

			param = typeof param === "string" && { url: param } || param;
			optionDataString = $.param( $.extend( { data: value }, param.data ) );
			if ( previous.valid !== null && previous.old === optionDataString ) {
				return previous.valid;
			}

			previous.old = optionDataString;
			previous.valid = null;
			validator = this;
			this.startRequest( element );
			data = {};
			data[ element.name ] = value;
			$.ajax( $.extend( true, {
				mode: "abort",
				port: this.elementAjaxPort( element ),
				dataType: "json",
				data: data,
				context: validator.currentForm,
				success: function( response ) {
					var valid = response === true || response === "true",
						errors, message, submitted;

					validator.settings.messages[ element.name ][ method ] = previous.originalMessage;
					if ( valid ) {
						submitted = validator.formSubmitted;
						validator.toHide = validator.errorsFor( element );
						validator.formSubmitted = submitted;
						validator.successList.push( element );
						validator.invalid[ element.name ] = false;
						validator.showErrors();
					} else {
						errors = {};
						message = response || validator.defaultMessage( element, { method: method, parameters: value } );
						errors[ element.name ] = previous.message = message;
						validator.invalid[ element.name ] = true;
						validator.showErrors( errors );
					}
					previous.valid = valid;
					validator.stopRequest( element, valid );
				}
			}, param ) );
			return "pending";
		}
	}

} );

// Ajax mode: abort
// usage: $.ajax({ mode: "abort"[, port: "uniqueport"]});
//        $.ajaxAbort( port );
// if mode:"abort" is used, the previous request on that port (port can be undefined) is aborted via XMLHttpRequest.abort()

var pendingRequests = {},
	ajax;

// Use a prefilter if available (1.5+)
if ( $.ajaxPrefilter ) {
	$.ajaxPrefilter( function( settings, _, xhr ) {
		var port = settings.port;
		if ( settings.mode === "abort" ) {
			$.ajaxAbort( port );
			pendingRequests[ port ] = xhr;
		}
	} );
} else {

	// Proxy ajax
	ajax = $.ajax;
	$.ajax = function( settings ) {
		var mode = ( "mode" in settings ? settings : $.ajaxSettings ).mode,
			port = ( "port" in settings ? settings : $.ajaxSettings ).port;
		if ( mode === "abort" ) {
			$.ajaxAbort( port );
			pendingRequests[ port ] = ajax.apply( this, arguments );
			return pendingRequests[ port ];
		}
		return ajax.apply( this, arguments );
	};
}

// Abort the previous request without sending a new one
$.ajaxAbort = function( port ) {
	if ( pendingRequests[ port ] ) {
		pendingRequests[ port ].abort();
		delete pendingRequests[ port ];
	}
};
return $;
}));
}
if (!jQuery.validator.unobtrusive) {
/**
 * @license
 * Unobtrusive validation support library for jQuery and jQuery Validate
 * Copyright (c) .NET Foundation. All rights reserved.
 * Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
 * @version v4.0.0
 */

/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: false */
/*global document: false, jQuery: false */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define("jquery.validate.unobtrusive", ['jquery-validation'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS-like environments that support module.exports     
        module.exports = factory(require('jquery-validation'));
    } else {
        // Browser global
        jQuery.validator.unobtrusive = factory(jQuery);
    }
}(function ($) {
    var $jQval = $.validator,
        adapters,
        data_validation = "unobtrusiveValidation";

    function setValidationValues(options, ruleName, value) {
        options.rules[ruleName] = value;
        if (options.message) {
            options.messages[ruleName] = options.message;
        }
    }

    function splitAndTrim(value) {
        return value.replace(/^\s+|\s+$/g, "").split(/\s*,\s*/g);
    }

    function escapeAttributeValue(value) {
        // As mentioned on http://api.jquery.com/category/selectors/
        return value.replace(/([!"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~])/g, "\\$1");
    }

    function getModelPrefix(fieldName) {
        return fieldName.substr(0, fieldName.lastIndexOf(".") + 1);
    }

    function appendModelPrefix(value, prefix) {
        if (value.indexOf("*.") === 0) {
            value = value.replace("*.", prefix);
        }
        return value;
    }

    function onError(error, inputElement) {  // 'this' is the form element
        var container = $(this).find("[data-valmsg-for='" + escapeAttributeValue(inputElement[0].name) + "']"),
            replaceAttrValue = container.attr("data-valmsg-replace"),
            replace = replaceAttrValue ? $.parseJSON(replaceAttrValue) !== false : null;

        container.removeClass("field-validation-valid").addClass("field-validation-error");
        error.data("unobtrusiveContainer", container);

        if (replace) {
            container.empty();
            error.removeClass("input-validation-error").appendTo(container);
        }
        else {
            error.hide();
        }
    }

    function onErrors(event, validator) {  // 'this' is the form element
        var container = $(this).find("[data-valmsg-summary=true]"),
            list = container.find("ul");

        if (list && list.length && validator.errorList.length) {
            list.empty();
            container.addClass("validation-summary-errors").removeClass("validation-summary-valid");

            $.each(validator.errorList, function () {
                $("<li />").html(this.message).appendTo(list);
            });
        }
    }

    function onSuccess(error) {  // 'this' is the form element
        var container = error.data("unobtrusiveContainer");

        if (container) {
            var replaceAttrValue = container.attr("data-valmsg-replace"),
                replace = replaceAttrValue ? $.parseJSON(replaceAttrValue) : null;

            container.addClass("field-validation-valid").removeClass("field-validation-error");
            error.removeData("unobtrusiveContainer");

            if (replace) {
                container.empty();
            }
        }
    }

    function onReset(event) {  // 'this' is the form element
        var $form = $(this),
            key = '__jquery_unobtrusive_validation_form_reset';
        if ($form.data(key)) {
            return;
        }
        // Set a flag that indicates we're currently resetting the form.
        $form.data(key, true);
        try {
            $form.data("validator").resetForm();
        } finally {
            $form.removeData(key);
        }

        $form.find(".validation-summary-errors")
            .addClass("validation-summary-valid")
            .removeClass("validation-summary-errors");
        $form.find(".field-validation-error")
            .addClass("field-validation-valid")
            .removeClass("field-validation-error")
            .removeData("unobtrusiveContainer")
            .find(">*")  // If we were using valmsg-replace, get the underlying error
            .removeData("unobtrusiveContainer");
    }

    function validationInfo(form) {
        var $form = $(form),
            result = $form.data(data_validation),
            onResetProxy = $.proxy(onReset, form),
            defaultOptions = $jQval.unobtrusive.options || {},
            execInContext = function (name, args) {
                var func = defaultOptions[name];
                func && $.isFunction(func) && func.apply(form, args);
            };

        if (!result) {
            result = {
                options: {  // options structure passed to jQuery Validate's validate() method
                    errorClass: defaultOptions.errorClass || "input-validation-error",
                    errorElement: defaultOptions.errorElement || "span",
                    errorPlacement: function () {
                        onError.apply(form, arguments);
                        execInContext("errorPlacement", arguments);
                    },
                    invalidHandler: function () {
                        onErrors.apply(form, arguments);
                        execInContext("invalidHandler", arguments);
                    },
                    messages: {},
                    rules: {},
                    success: function () {
                        onSuccess.apply(form, arguments);
                        execInContext("success", arguments);
                    }
                },
                attachValidation: function () {
                    $form
                        .off("reset." + data_validation, onResetProxy)
                        .on("reset." + data_validation, onResetProxy)
                        .validate(this.options);
                },
                validate: function () {  // a validation function that is called by unobtrusive Ajax
                    $form.validate();
                    return $form.valid();
                }
            };
            $form.data(data_validation, result);
        }

        return result;
    }

    $jQval.unobtrusive = {
        adapters: [],

        parseElement: function (element, skipAttach) {
            /// <summary>
            /// Parses a single HTML element for unobtrusive validation attributes.
            /// </summary>
            /// <param name="element" domElement="true">The HTML element to be parsed.</param>
            /// <param name="skipAttach" type="Boolean">[Optional] true to skip attaching the
            /// validation to the form. If parsing just this single element, you should specify true.
            /// If parsing several elements, you should specify false, and manually attach the validation
            /// to the form when you are finished. The default is false.</param>
            var $element = $(element),
                form = $element.parents("form")[0],
                valInfo, rules, messages;

            if (!form) {  // Cannot do client-side validation without a form
                return;
            }

            valInfo = validationInfo(form);
            valInfo.options.rules[element.name] = rules = {};
            valInfo.options.messages[element.name] = messages = {};

            $.each(this.adapters, function () {
                var prefix = "data-val-" + this.name,
                    message = $element.attr(prefix),
                    paramValues = {};

                if (message !== undefined) {  // Compare against undefined, because an empty message is legal (and falsy)
                    prefix += "-";

                    $.each(this.params, function () {
                        paramValues[this] = $element.attr(prefix + this);
                    });

                    this.adapt({
                        element: element,
                        form: form,
                        message: message,
                        params: paramValues,
                        rules: rules,
                        messages: messages
                    });
                }
            });

            $.extend(rules, { "__dummy__": true });

            if (!skipAttach) {
                valInfo.attachValidation();
            }
        },

        parse: function (selector) {
            /// <summary>
            /// Parses all the HTML elements in the specified selector. It looks for input elements decorated
            /// with the [data-val=true] attribute value and enables validation according to the data-val-*
            /// attribute values.
            /// </summary>
            /// <param name="selector" type="String">Any valid jQuery selector.</param>

            // $forms includes all forms in selector's DOM hierarchy (parent, children and self) that have at least one
            // element with data-val=true
            var $selector = $(selector),
                $forms = $selector.parents()
                    .addBack()
                    .filter("form")
                    .add($selector.find("form"))
                    .has("[data-val=true]");

            $selector.find("[data-val=true]").each(function () {
                $jQval.unobtrusive.parseElement(this, true);
            });

            $forms.each(function () {
                var info = validationInfo(this);
                if (info) {
                    info.attachValidation();
                }
            });
        }
    };

    adapters = $jQval.unobtrusive.adapters;

    adapters.add = function (adapterName, params, fn) {
        /// <summary>Adds a new adapter to convert unobtrusive HTML into a jQuery Validate validation.</summary>
        /// <param name="adapterName" type="String">The name of the adapter to be added. This matches the name used
        /// in the data-val-nnnn HTML attribute (where nnnn is the adapter name).</param>
        /// <param name="params" type="Array" optional="true">[Optional] An array of parameter names (strings) that will
        /// be extracted from the data-val-nnnn-mmmm HTML attributes (where nnnn is the adapter name, and
        /// mmmm is the parameter name).</param>
        /// <param name="fn" type="Function">The function to call, which adapts the values from the HTML
        /// attributes into jQuery Validate rules and/or messages.</param>
        /// <returns type="jQuery.validator.unobtrusive.adapters" />
        if (!fn) {  // Called with no params, just a function
            fn = params;
            params = [];
        }
        this.push({ name: adapterName, params: params, adapt: fn });
        return this;
    };

    adapters.addBool = function (adapterName, ruleName) {
        /// <summary>Adds a new adapter to convert unobtrusive HTML into a jQuery Validate validation, where
        /// the jQuery Validate validation rule has no parameter values.</summary>
        /// <param name="adapterName" type="String">The name of the adapter to be added. This matches the name used
        /// in the data-val-nnnn HTML attribute (where nnnn is the adapter name).</param>
        /// <param name="ruleName" type="String" optional="true">[Optional] The name of the jQuery Validate rule. If not provided, the value
        /// of adapterName will be used instead.</param>
        /// <returns type="jQuery.validator.unobtrusive.adapters" />
        return this.add(adapterName, function (options) {
            setValidationValues(options, ruleName || adapterName, true);
        });
    };

    adapters.addMinMax = function (adapterName, minRuleName, maxRuleName, minMaxRuleName, minAttribute, maxAttribute) {
        /// <summary>Adds a new adapter to convert unobtrusive HTML into a jQuery Validate validation, where
        /// the jQuery Validate validation has three potential rules (one for min-only, one for max-only, and
        /// one for min-and-max). The HTML parameters are expected to be named -min and -max.</summary>
        /// <param name="adapterName" type="String">The name of the adapter to be added. This matches the name used
        /// in the data-val-nnnn HTML attribute (where nnnn is the adapter name).</param>
        /// <param name="minRuleName" type="String">The name of the jQuery Validate rule to be used when you only
        /// have a minimum value.</param>
        /// <param name="maxRuleName" type="String">The name of the jQuery Validate rule to be used when you only
        /// have a maximum value.</param>
        /// <param name="minMaxRuleName" type="String">The name of the jQuery Validate rule to be used when you
        /// have both a minimum and maximum value.</param>
        /// <param name="minAttribute" type="String" optional="true">[Optional] The name of the HTML attribute that
        /// contains the minimum value. The default is "min".</param>
        /// <param name="maxAttribute" type="String" optional="true">[Optional] The name of the HTML attribute that
        /// contains the maximum value. The default is "max".</param>
        /// <returns type="jQuery.validator.unobtrusive.adapters" />
        return this.add(adapterName, [minAttribute || "min", maxAttribute || "max"], function (options) {
            var min = options.params.min,
                max = options.params.max;

            if (min && max) {
                setValidationValues(options, minMaxRuleName, [min, max]);
            }
            else if (min) {
                setValidationValues(options, minRuleName, min);
            }
            else if (max) {
                setValidationValues(options, maxRuleName, max);
            }
        });
    };

    adapters.addSingleVal = function (adapterName, attribute, ruleName) {
        /// <summary>Adds a new adapter to convert unobtrusive HTML into a jQuery Validate validation, where
        /// the jQuery Validate validation rule has a single value.</summary>
        /// <param name="adapterName" type="String">The name of the adapter to be added. This matches the name used
        /// in the data-val-nnnn HTML attribute(where nnnn is the adapter name).</param>
        /// <param name="attribute" type="String">[Optional] The name of the HTML attribute that contains the value.
        /// The default is "val".</param>
        /// <param name="ruleName" type="String" optional="true">[Optional] The name of the jQuery Validate rule. If not provided, the value
        /// of adapterName will be used instead.</param>
        /// <returns type="jQuery.validator.unobtrusive.adapters" />
        return this.add(adapterName, [attribute || "val"], function (options) {
            setValidationValues(options, ruleName || adapterName, options.params[attribute]);
        });
    };

    $jQval.addMethod("__dummy__", function (value, element, params) {
        return true;
    });

    $jQval.addMethod("regex", function (value, element, params) {
        var match;
        if (this.optional(element)) {
            return true;
        }

        match = new RegExp(params).exec(value);
        return (match && (match.index === 0) && (match[0].length === value.length));
    });

    $jQval.addMethod("nonalphamin", function (value, element, nonalphamin) {
        var match;
        if (nonalphamin) {
            match = value.match(/\W/g);
            match = match && match.length >= nonalphamin;
        }
        return match;
    });

    if ($jQval.methods.extension) {
        adapters.addSingleVal("accept", "mimtype");
        adapters.addSingleVal("extension", "extension");
    } else {
        // for backward compatibility, when the 'extension' validation method does not exist, such as with versions
        // of JQuery Validation plugin prior to 1.10, we should use the 'accept' method for
        // validating the extension, and ignore mime-type validations as they are not supported.
        adapters.addSingleVal("extension", "extension", "accept");
    }

    adapters.addSingleVal("regex", "pattern");
    adapters.addBool("creditcard").addBool("date").addBool("digits").addBool("email").addBool("number").addBool("url");
    adapters.addMinMax("length", "minlength", "maxlength", "rangelength").addMinMax("range", "min", "max", "range");
    adapters.addMinMax("minlength", "minlength").addMinMax("maxlength", "minlength", "maxlength");
    adapters.add("equalto", ["other"], function (options) {
        var prefix = getModelPrefix(options.element.name),
            other = options.params.other,
            fullOtherName = appendModelPrefix(other, prefix),
            element = $(options.form).find(":input").filter("[name='" + escapeAttributeValue(fullOtherName) + "']")[0];

        setValidationValues(options, "equalTo", element);
    });
    adapters.add("required", function (options) {
        // jQuery Validate equates "required" with "mandatory" for checkbox elements
        if (options.element.tagName.toUpperCase() !== "INPUT" || options.element.type.toUpperCase() !== "CHECKBOX") {
            setValidationValues(options, "required", true);
        }
    });
    adapters.add("remote", ["url", "type", "additionalfields"], function (options) {
        var value = {
            url: options.params.url,
            type: options.params.type || "GET",
            data: {}
        },
            prefix = getModelPrefix(options.element.name);

        $.each(splitAndTrim(options.params.additionalfields || options.element.name), function (i, fieldName) {
            var paramName = appendModelPrefix(fieldName, prefix);
            value.data[paramName] = function () {
                var field = $(options.form).find(":input").filter("[name='" + escapeAttributeValue(paramName) + "']");
                // For checkboxes and radio buttons, only pick up values from checked fields.
                if (field.is(":checkbox")) {
                    return field.filter(":checked").val() || field.filter(":hidden").val() || '';
                }
                else if (field.is(":radio")) {
                    return field.filter(":checked").val() || '';
                }
                return field.val();
            };
        });

        setValidationValues(options, "remote", value);
    });
    adapters.add("password", ["min", "nonalphamin", "regex"], function (options) {
        if (options.params.min) {
            setValidationValues(options, "minlength", options.params.min);
        }
        if (options.params.nonalphamin) {
            setValidationValues(options, "nonalphamin", options.params.nonalphamin);
        }
        if (options.params.regex) {
            setValidationValues(options, "regex", options.params.regex);
        }
    });
    adapters.add("fileextensions", ["extensions"], function (options) {
        setValidationValues(options, "extension", options.params.extensions);
    });

    $(function () {
        $jQval.unobtrusive.parse(document);
    });

    return $jQval.unobtrusive;
}));

}
})();
(() => {
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };

  // src/utils.js
  function resolveFunction(name) {
    if (typeof name === "function") {
      return name;
    }
    if (!name) {
      return null;
    }
    let target = window;
    for (const part of String(name).split(".")) {
      if (target == null) {
        return null;
      }
      target = target[part];
    }
    return typeof target === "function" ? target : null;
  }
  function dispatch(form, name, detail, cancelable) {
    const event = new CustomEvent("formhelper:" + name, {
      bubbles: true,
      cancelable: !!cancelable,
      detail
    });
    return form.dispatchEvent(event);
  }
  function classList(value) {
    return value ? String(value).split(/\s+/).filter(Boolean) : [];
  }
  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function setText(element, lines) {
    element.textContent = "";
    const list = Array.isArray(lines) ? lines : String(lines).split(/\r?\n/);
    list.forEach((line, index) => {
      if (index > 0) {
        element.appendChild(document.createElement("br"));
      }
      element.appendChild(document.createTextNode(line));
    });
  }
  function toForm(target) {
    if (!target) {
      return null;
    }
    if (typeof target === "string") {
      target = document.querySelector(target);
    } else if (target.jquery) {
      target = target[0];
    }
    if (target && target.tagName !== "FORM" && target.form) {
      target = target.form;
    }
    return target && target.tagName === "FORM" ? target : null;
  }
  function isFormHelperForm(form) {
    return !!form && form.tagName === "FORM" && form.hasAttribute("data-formhelper");
  }
  function normalizeFieldName(name) {
    return String(name || "").replace(/^\$\.?/, "");
  }

  // src/messages.js
  var describedByCounter = 0;
  function fieldElements(form, name) {
    const key = normalizeFieldName(name).toLowerCase();
    return Array.from(form.elements).filter((e) => e.name && e.name.toLowerCase() === key);
  }
  function messageElements(form, name) {
    const key = normalizeFieldName(name).toLowerCase();
    return Array.from(form.querySelectorAll("[data-valmsg-for]")).filter((e) => e.getAttribute("data-valmsg-for").toLowerCase() === key);
  }
  function replaces(messageElement) {
    return messageElement.getAttribute("data-valmsg-replace") !== "false";
  }
  function showFieldErrors(form, name, messages, options) {
    const inputs = fieldElements(form, name);
    const targets = messageElements(form, name);
    inputs.forEach((input) => {
      input.classList.remove("input-validation-valid");
      input.classList.add("input-validation-error", ...classList(options.inputErrorClass));
      input.setAttribute("aria-invalid", "true");
    });
    targets.forEach((target) => {
      target.classList.remove("field-validation-valid");
      target.classList.add("field-validation-error", ...classList(options.messageErrorClass));
      if (replaces(target)) {
        setText(target, messages);
      }
      if (!target.id) {
        target.id = "formhelper-message-" + ++describedByCounter;
      }
      inputs.forEach((input) => {
        const describedBy = classList(input.getAttribute("aria-describedby"));
        if (describedBy.indexOf(target.id) === -1) {
          input.setAttribute("aria-describedby", describedBy.concat(target.id).join(" "));
        }
      });
    });
    return targets.length > 0;
  }
  function clearFieldErrors(form, name, options) {
    fieldElements(form, name).forEach((input) => clearInput(input, options));
    messageElements(form, name).forEach((target) => clearMessage(target, options));
  }
  function clearAllErrors(form, options) {
    Array.from(form.elements).forEach((input) => clearInput(input, options));
    Array.from(form.querySelectorAll("[data-valmsg-for]")).forEach((target) => clearMessage(target, options));
    setSummary(form, []);
  }
  function clearInput(input, options) {
    if (input.classList.contains("input-validation-error")) {
      input.classList.remove("input-validation-error", ...classList(options.inputErrorClass));
      input.classList.add("input-validation-valid");
    }
    input.removeAttribute("aria-invalid");
  }
  function clearMessage(target, options) {
    target.classList.remove("field-validation-error", ...classList(options.messageErrorClass));
    target.classList.add("field-validation-valid");
    if (replaces(target)) {
      target.textContent = "";
    }
  }
  function getSummary(form) {
    return form.querySelector('[data-valmsg-summary="true"], [data-fh-summary]');
  }
  function setSummary(form, messages) {
    const summary = getSummary(form);
    if (!summary) {
      return false;
    }
    let list = summary.querySelector("ul");
    if (!list) {
      list = document.createElement("ul");
      summary.appendChild(list);
    }
    list.textContent = "";
    messages.forEach((message) => {
      const item = document.createElement("li");
      setText(item, message);
      list.appendChild(item);
    });
    summary.classList.toggle("validation-summary-errors", messages.length > 0);
    summary.classList.toggle("validation-summary-valid", messages.length === 0);
    return true;
  }
  function focusFirstInvalid(form) {
    const invalid = Array.from(form.elements).find((e) => e.getAttribute("aria-invalid") === "true" || e.classList.contains("input-validation-error"));
    if (invalid && typeof invalid.focus === "function") {
      invalid.focus();
    }
  }

  // src/fill.js
  function fillForm(form, data, callbacks, prefix) {
    if (!data) {
      return;
    }
    Object.keys(data).forEach((key) => {
      const value = data[key];
      const name = (prefix || "") + key;
      if (callbacks && typeof callbacks[name] === "function") {
        callbacks[name](value);
        return;
      }
      const all = fieldElements(form, name);
      const elements = all.length > 1 ? all.filter((e) => e.type !== "hidden") : all;
      if (elements.length === 0) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          fillForm(form, value, callbacks, name + ".");
        }
        return;
      }
      elements.forEach((element) => setValue(element, value));
    });
  }
  function setValue(element, value) {
    if (element.type === "checkbox") {
      if (Array.isArray(value)) {
        element.checked = value.map(String).indexOf(element.value) !== -1;
      } else {
        element.checked = value === true || value === "true" || value === "True" || value === 1 || value === "1";
      }
    } else if (element.type === "radio") {
      element.checked = value != null && String(value) === element.value;
    } else if (element.tagName === "SELECT" && element.multiple) {
      const values = Array.isArray(value) ? value.map(String) : String(value == null ? "" : value).split(/[ ,]+/);
      Array.from(element.options).forEach((option) => option.selected = values.indexOf(option.value) !== -1);
    } else if (element.type !== "file") {
      element.value = value == null ? "" : value;
    }
  }

  // src/options.js
  var globals = {
    dataType: "formdata",
    redirectDelay: 1500,
    toastrPosition: "formhelper-toast-top-right",
    enableButtonAfterSuccess: false,
    resetFormAfterSuccess: true,
    checkMessage: "Check the form fields.",
    // Shown when the response is not a FormResult (e.g. a 500 error page). The details go to the console.
    // Forms rendered by the tag helper carry FormHelperOptions.ErrorMessage instead.
    errorMessage: "An error occurred. Please try again.",
    validation: "auto",
    inputErrorClass: "",
    messageErrorClass: "",
    callback: null,
    beforeSubmit: null,
    // undefined: fhToastr, false: no notifications, function({ type, message, form }): your own notifications.
    notify: void 0
  };
  function getFormOptions(form) {
    const data = form.dataset;
    const bool = (value, fallback) => value == null ? fallback : value.toLowerCase() === "true";
    const text = (value, fallback) => value == null || value === "" ? fallback : value;
    const redirectDelay = parseInt(data.fhRedirectDelay, 10);
    return {
      url: form.getAttribute("action") || window.location.href,
      method: (form.getAttribute("method") || "post").toUpperCase(),
      dataType: text(data.fhDataType, globals.dataType).toLowerCase(),
      redirectDelay: isNaN(redirectDelay) ? globals.redirectDelay : redirectDelay,
      toastrPosition: text(data.fhToastrPosition, globals.toastrPosition),
      enableButtonAfterSuccess: bool(data.fhEnableButtonAfterSuccess, globals.enableButtonAfterSuccess),
      resetFormAfterSuccess: bool(data.fhResetFormAfterSuccess, globals.resetFormAfterSuccess),
      checkMessage: text(data.fhCheckMessage, globals.checkMessage),
      errorMessage: text(data.fhErrorMessage, globals.errorMessage),
      validation: text(data.fhValidation, globals.validation).toLowerCase(),
      inputErrorClass: text(data.fhInputErrorClass, globals.inputErrorClass),
      messageErrorClass: text(data.fhMessageErrorClass, globals.messageErrorClass),
      callback: text(data.fhCallback, globals.callback),
      beforeSubmit: text(data.fhBeforeSubmit, globals.beforeSubmit),
      notify: globals.notify
    };
  }

  // src/request.js
  var TOKEN_FIELD = "__RequestVerificationToken";
  var TOKEN_HEADER = "RequestVerificationToken";
  function buildRequest(form, options, submitter) {
    const headers = {
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "application/json"
    };
    let url = submitter && submitter.getAttribute("formaction") || options.url;
    const method = (submitter && submitter.getAttribute("formmethod") || options.method).toUpperCase();
    let body;
    if (method === "GET") {
      const query = new URLSearchParams();
      toFormData(form, submitter).forEach((value, key) => {
        if (typeof value === "string") {
          query.append(key, value);
        }
      });
      url += (url.indexOf("?") === -1 ? "?" : "&") + query.toString();
    } else if (options.dataType === "json") {
      const { data, token } = toJson(form, submitter);
      if (token) {
        headers[TOKEN_HEADER] = token;
      }
      headers["Content-Type"] = "application/json; charset=utf-8";
      body = JSON.stringify(data);
    } else {
      body = toFormData(form, submitter);
    }
    return { url, method, headers, body };
  }
  function toFormData(form, submitter) {
    let formData;
    try {
      formData = submitter ? new FormData(form, submitter) : new FormData(form);
    } catch (e) {
      formData = new FormData(form);
    }
    if (submitter && submitter.name && !formData.has(submitter.name)) {
      formData.append(submitter.name, submitter.value);
    }
    return formData;
  }
  function toJson(form, submitter) {
    const elements = Array.from(form.elements).filter((e) => e.name && !e.disabled);
    const checkboxes = {};
    elements.forEach((e) => {
      if (e.type === "checkbox") {
        checkboxes[e.name] = (checkboxes[e.name] || 0) + 1;
      }
    });
    const values = [];
    let token = null;
    elements.forEach((element) => {
      const { name, type } = element;
      if (name === TOKEN_FIELD) {
        token = element.value;
        return;
      }
      if (type === "file" || type === "submit" || type === "button" || type === "reset" || type === "image") {
        return;
      }
      if (type === "hidden" && checkboxes[name]) {
        return;
      }
      if (type === "checkbox") {
        if (checkboxes[name] === 1 && element.value.toLowerCase() === "true") {
          values.push([name, element.checked, false]);
        } else if (element.checked) {
          values.push([name, element.value, checkboxes[name] > 1]);
        }
        return;
      }
      if (type === "radio") {
        if (element.checked) {
          values.push([name, element.value, false]);
        }
        return;
      }
      if (element.tagName === "SELECT" && element.multiple) {
        values.push([name, Array.from(element.selectedOptions).map((o) => o.value), false]);
        return;
      }
      values.push([name, element.value === "" ? null : element.value, false]);
    });
    if (submitter && submitter.name) {
      values.push([submitter.name, submitter.value, false]);
    }
    const data = {};
    const counts = {};
    values.forEach(([name]) => counts[name] = (counts[name] || 0) + 1);
    values.forEach(([name, value, asArray]) => {
      if (asArray || counts[name] > 1) {
        const current = getPath(data, name);
        setPath(data, name, Array.isArray(current) ? current.concat(value) : [value]);
      } else {
        setPath(data, name, value);
      }
    });
    return { data, token };
  }
  function tokens(name) {
    return name.replace(/\[(\d*)\]/g, ".$1").split(".").filter((t) => t !== "");
  }
  function getPath(target, name) {
    return tokens(name).reduce((current, token) => current == null ? void 0 : current[token], target);
  }
  function setPath(target, name, value) {
    const parts = tokens(name);
    let current = target;
    if (parts.some((p) => p === "__proto__" || p === "constructor" || p === "prototype")) {
      return;
    }
    parts.forEach((token, index) => {
      if (index === parts.length - 1) {
        current[token] = value;
        return;
      }
      if (current[token] == null || typeof current[token] !== "object") {
        current[token] = /^\d+$/.test(parts[index + 1]) ? [] : {};
      }
      current = current[token];
    });
  }

  // src/toast.js
  var defaults = {
    containerId: "formhelper-toast-container",
    target: "body",
    toastClass: "formhelper-toast",
    titleClass: "formhelper-toast-title",
    messageClass: "formhelper-toast-message",
    closeClass: "formhelper-toast-close-button",
    progressClass: "formhelper-toast-progress",
    positionClass: "formhelper-toast-top-right",
    iconClasses: {
      error: "formhelper-toast-error",
      info: "formhelper-toast-info",
      success: "formhelper-toast-success",
      warning: "formhelper-toast-warning"
    },
    timeOut: 5e3,
    // set timeOut and extendedTimeOut to 0 to make it sticky
    extendedTimeOut: 1e3,
    showDuration: 300,
    hideDuration: 1e3,
    closeButton: false,
    closeHtml: '<button type="button">&times;</button>',
    progressBar: false,
    preventDuplicates: false,
    newestOnTop: true,
    tapToDismiss: true,
    closeOnHover: true,
    // true: message and title are shown as text. Set false to show html you trust (never user input).
    escapeHtml: true,
    rtl: false,
    onclick: null,
    onShown: null,
    onHidden: null,
    onCloseClick: null
  };
  var HIDDEN_CLASS = "formhelper-toast-hidden";
  var previousMessage;
  var toastr = {
    version: "6.0.0",
    options: {},
    success: (message, title, options) => notify("success", message, title, options),
    info: (message, title, options) => notify("info", message, title, options),
    warning: (message, title, options) => notify("warning", message, title, options),
    error: (message, title, options) => notify("error", message, title, options),
    clear,
    remove
  };
  function getOptions(override) {
    const options = Object.assign({}, defaults, toastr.options, override);
    options.iconClasses = Object.assign({}, defaults.iconClasses, toastr.options.iconClasses, override && override.iconClasses);
    return options;
  }
  function getContainer(options, create) {
    let container = document.getElementById(options.containerId);
    if (!container && create) {
      container = document.createElement("div");
      container.id = options.containerId;
      (document.querySelector(options.target) || document.body).appendChild(container);
    }
    return container;
  }
  function setContent(element, value, escape) {
    if (escape) {
      setText(element, String(value));
    } else {
      element.innerHTML = value;
    }
  }
  function notify(type, message, title, override) {
    const options = getOptions(override);
    if (options.preventDuplicates) {
      if (message === previousMessage) {
        return null;
      }
      previousMessage = message;
    }
    const container = getContainer(options, true);
    container.className = options.positionClass;
    const toast = document.createElement("div");
    toast.className = options.toastClass + " " + options.iconClasses[type];
    toast.setAttribute("role", type === "error" || type === "warning" ? "alert" : "status");
    toast.setAttribute("aria-live", type === "error" || type === "warning" ? "assertive" : "polite");
    if (options.rtl) {
      toast.classList.add("rtl");
    }
    let progress = null;
    if (options.progressBar) {
      progress = document.createElement("div");
      progress.className = options.progressClass;
      toast.appendChild(progress);
    }
    if (options.closeButton) {
      const template = document.createElement("template");
      template.innerHTML = options.closeHtml.trim();
      const close = template.content.firstElementChild;
      close.classList.add(options.closeClass);
      close.setAttribute("role", "button");
      close.setAttribute("aria-label", "Close");
      close.addEventListener("click", (event) => {
        event.stopPropagation();
        if (options.onCloseClick) {
          options.onCloseClick(event);
        }
        hide(true);
      });
      toast.insertBefore(close, toast.firstChild);
    }
    if (title) {
      const titleElement = document.createElement("div");
      titleElement.className = options.titleClass;
      setContent(titleElement, title, options.escapeHtml);
      toast.appendChild(titleElement);
    }
    if (message) {
      const messageElement = document.createElement("div");
      messageElement.className = options.messageClass;
      setContent(messageElement, message, options.escapeHtml);
      toast.appendChild(messageElement);
    }
    if (options.newestOnTop) {
      container.insertBefore(toast, container.firstChild);
    } else {
      container.appendChild(toast);
    }
    toast.classList.add(HIDDEN_CLASS);
    toast.style.transitionDuration = options.showDuration + "ms";
    void toast.offsetWidth;
    toast.classList.remove(HIDDEN_CLASS);
    if (options.onShown) {
      setTimeout(options.onShown, options.showDuration);
    }
    let hideTimer = null;
    let progressTimer = null;
    let hideEta = 0;
    let maxHideTime = 0;
    let hidden = false;
    function startTimer(duration) {
      if (duration > 0) {
        hideTimer = setTimeout(() => hide(false), duration);
        maxHideTime = duration;
        hideEta = Date.now() + duration;
        if (progress && !progressTimer) {
          progressTimer = setInterval(() => {
            const percentage = Math.max(0, (hideEta - Date.now()) / maxHideTime * 100);
            progress.style.width = percentage + "%";
          }, 10);
        }
      }
    }
    function hide(override2) {
      if (hidden || !override2 && toast.contains(document.activeElement)) {
        return;
      }
      hidden = true;
      clearTimeout(hideTimer);
      clearInterval(progressTimer);
      toast.style.transitionDuration = options.hideDuration + "ms";
      toast.classList.add(HIDDEN_CLASS);
      setTimeout(() => {
        removeToast(toast);
        if (options.onHidden) {
          options.onHidden();
        }
      }, options.hideDuration);
    }
    if (options.closeOnHover) {
      toast.addEventListener("mouseenter", () => {
        if (hidden) {
          return;
        }
        clearTimeout(hideTimer);
        hideEta = 0;
      });
      toast.addEventListener("mouseleave", () => {
        if (!hidden && (options.timeOut > 0 || options.extendedTimeOut > 0)) {
          startTimer(options.extendedTimeOut);
        }
      });
    }
    if (options.onclick) {
      toast.addEventListener("click", (event) => {
        options.onclick(event);
        hide(false);
      });
    } else if (options.tapToDismiss) {
      toast.addEventListener("click", () => hide(false));
    }
    startTimer(options.timeOut);
    toast.formhelperHide = hide;
    return toast;
  }
  function removeToast(toast) {
    const container = toast.parentNode;
    if (container) {
      container.removeChild(toast);
      if (container.children.length === 0 && container.parentNode) {
        container.parentNode.removeChild(container);
        previousMessage = void 0;
      }
    }
  }
  function clear(toast) {
    const toasts = toast ? [toast.jquery ? toast[0] : toast] : currentToasts();
    toasts.forEach((t) => t && t.formhelperHide ? t.formhelperHide(true) : t && removeToast(t));
  }
  function remove(toast) {
    const toasts = toast ? [toast.jquery ? toast[0] : toast] : currentToasts();
    toasts.forEach((t) => t && removeToast(t));
  }
  function currentToasts() {
    const container = getContainer(getOptions(), false);
    return container ? Array.from(container.children) : [];
  }

  // src/validation/rules.js
  var rules = /* @__PURE__ */ Object.create(null);
  function addRule(name, validate) {
    rules[String(name).toLowerCase()] = validate;
  }
  function toNumber(value) {
    return value === "" || value == null ? NaN : Number(String(value).trim().replace(",", "."));
  }
  function lengthOf(value, element, form) {
    if (element.tagName === "SELECT") {
      return Array.from(element.options).filter((o) => o.selected).length;
    }
    if (element.type === "checkbox" || element.type === "radio") {
      return fieldElements(form, element.name).filter((e) => e.checked).length;
    }
    return value.length;
  }
  addRule("required", (value) => value.trim() !== "");
  addRule("length", (value, element, params, form) => {
    const length = lengthOf(value, element, form);
    return (!params.min || length >= Number(params.min)) && (!params.max || length <= Number(params.max));
  });
  addRule("minlength", (value, element, params, form) => lengthOf(value, element, form) >= Number(params.min));
  addRule("maxlength", (value, element, params, form) => lengthOf(value, element, form) <= Number(params.max));
  addRule("range", (value, element, params) => {
    const number = toNumber(value);
    if (isNaN(number)) {
      return false;
    }
    const min = toNumber(params.min);
    const max = toNumber(params.max);
    return (isNaN(min) || number >= min) && (isNaN(max) || number <= max);
  });
  addRule("number", (value) => /^[-+]?(\d+([.,]\d*)?|[.,]\d+)$/.test(value.trim()));
  addRule("regex", (value, element, params) => {
    let expression;
    try {
      expression = new RegExp(params.pattern);
    } catch (e) {
      console.warn("FormHelper: the pattern of " + element.name + " is not valid in JavaScript; it is validated on the server only.", e);
      return true;
    }
    const match = expression.exec(value);
    return !!match && match.index === 0 && match[0].length === value.length;
  });
  addRule("email", (value) => /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value));
  addRule("url", (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "ftp:";
    } catch (e) {
      return false;
    }
  });
  addRule("phone", (value) => {
    const number = value.trim().replace(/\s*(x|ext\.?|extension)\s*\d+$/i, "");
    return /^\+?[\d\s().-]+$/.test(number) && /\d/.test(number);
  });
  addRule("creditcard", (value) => {
    if (/[^0-9 \-]+/.test(value)) {
      return false;
    }
    const digits = value.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) {
      return false;
    }
    let sum = 0;
    let even = false;
    for (let n = digits.length - 1; n >= 0; n--) {
      let digit = parseInt(digits.charAt(n), 10);
      if (even && (digit *= 2) > 9) {
        digit -= 9;
      }
      sum += digit;
      even = !even;
    }
    return sum % 10 === 0;
  });
  addRule("equalto", (value, element, params, form) => {
    let other = params.other || "";
    if (other.indexOf("*.") === 0) {
      const name = element.name;
      const prefix = name.substr(0, name.lastIndexOf(".") + 1);
      other = prefix + other.substr(2);
    }
    const target = fieldElements(form, other)[0];
    return !target || target.value === value;
  });
  var remoteRequests = /* @__PURE__ */ new WeakMap();
  addRule("remote", (value, element, params, form) => {
    if (!params.url) {
      return true;
    }
    const method = (params.type || "GET").toUpperCase();
    const prefix = element.name.substr(0, element.name.lastIndexOf(".") + 1);
    const data = new URLSearchParams();
    String(params.additionalfields || element.name).split(",").map((field) => field.trim()).filter(Boolean).map((field) => field.indexOf("*.") === 0 ? prefix + field.substr(2) : field).forEach((field) => data.append(field, remoteFieldValue(form, field)));
    const key = method + " " + params.url + "?" + data.toString();
    const previous = remoteRequests.get(element);
    if (previous && previous.key === key) {
      return previous.promise;
    }
    const headers = { "X-Requested-With": "XMLHttpRequest", "Accept": "application/json" };
    let request;
    if (method === "GET") {
      request = fetch(params.url + (params.url.indexOf("?") === -1 ? "?" : "&") + data.toString(), { headers, credentials: "same-origin" });
    } else {
      const token = form.querySelector('input[name="__RequestVerificationToken"]');
      if (token) {
        headers["RequestVerificationToken"] = token.value;
      }
      headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
      request = fetch(params.url, { method, headers, body: data, credentials: "same-origin" });
    }
    const promise = request.then((response) => {
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      return response.json();
    }).then((result) => {
      if (result === true || result === "true") {
        return true;
      }
      return typeof result === "string" && result !== "" ? result : false;
    }).catch((error) => {
      console.warn("FormHelper: remote validation failed (" + params.url + ").", error);
      remoteRequests.delete(element);
      return true;
    });
    remoteRequests.set(element, { key, promise });
    return promise;
  });
  function remoteFieldValue(form, name) {
    const elements = fieldElements(form, name);
    const first = elements[0];
    if (!first) {
      return "";
    }
    if (first.type === "checkbox" || first.type === "radio") {
      const checked = elements.find((e) => (e.type === "checkbox" || e.type === "radio") && e.checked);
      const hidden = elements.find((e) => e.type === "hidden");
      return checked ? checked.value : hidden ? hidden.value : "";
    }
    return first.value;
  }
  addRule("fileextensions", (value, element, params) => {
    const allowed = String(params.extensions || "png,jpg,jpeg,gif").split(",").map((e) => e.trim().replace(/^\./, "").toLowerCase()).filter(Boolean);
    const names = element.files && element.files.length > 0 ? Array.from(element.files).map((f) => f.name) : [value];
    return names.every((name) => allowed.indexOf(name.split(".").pop().toLowerCase()) !== -1);
  });

  // src/validation/builtin.js
  function createBuiltInEngine(clientRules) {
    return {
      name: clientRules ? "builtin" : "none",
      async validate(form, options) {
        if (!clientRules) {
          return true;
        }
        const names = validatedFieldNames(form);
        const results = await Promise.all(names.map((name) => validateField(form, name, options)));
        const messages = results.filter((r) => r !== true);
        setSummary(form, messages);
        return messages.length === 0;
      },
      async validateElement(form, element, options) {
        if (!clientRules || !element.name) {
          return true;
        }
        return await validateField(form, element.name, options) === true;
      },
      showErrors(form, errors, options) {
        const unplaced = [];
        errors.forEach((error) => {
          if (!error.propertyName) {
            return;
          }
          if (!showFieldErrors(form, error.propertyName, error.messages, options)) {
            unplaced.push(...error.messages);
          }
        });
        return unplaced;
      },
      clear(form, options) {
        clearAllErrors(form, options);
      },
      focusInvalid(form) {
        focusFirstInvalid(form);
      }
    };
  }
  function validatedFieldNames(form) {
    const names = [];
    Array.from(form.elements).forEach((element) => {
      if (element.name && element.getAttribute("data-val") === "true" && names.indexOf(element.name) === -1) {
        names.push(element.name);
      }
    });
    return names;
  }
  async function validateField(form, name, options) {
    const elements = fieldElements(form, name);
    const element = elements.find((e) => e.getAttribute("data-val") === "true");
    if (!element || isIgnored(element, elements)) {
      return true;
    }
    const value = getValue(elements);
    for (const rule of getRules(element)) {
      const validate = rules[rule.name];
      if (!validate || value === "" && rule.name !== "required" && rule.name !== "equalto") {
        continue;
      }
      let result = validate(value, element, rule.params, form);
      if (result && typeof result.then === "function") {
        result = await result;
        if (getValue(fieldElements(form, name)) !== value) {
          return true;
        }
      }
      if (result !== true) {
        const message = typeof result === "string" && result !== "" ? result : rule.message;
        showFieldErrors(form, name, [message], options);
        return message;
      }
    }
    clearFieldErrors(form, name, options);
    return true;
  }
  function getRules(element) {
    const list = [];
    const attributes = Array.from(element.attributes);
    attributes.forEach((attribute) => {
      const match = /^data-val-([a-z0-9]+)$/i.exec(attribute.name);
      if (!match) {
        return;
      }
      const name = match[1].toLowerCase();
      if (name === "required" && element.type === "checkbox") {
        return;
      }
      const prefix = "data-val-" + name + "-";
      const params = {};
      attributes.forEach((a) => {
        if (a.name.toLowerCase().indexOf(prefix) === 0) {
          params[a.name.substring(prefix.length).toLowerCase()] = a.value;
        }
      });
      const rule = { name, message: attribute.value, params };
      if (name === "required") {
        list.unshift(rule);
      } else {
        list.push(rule);
      }
    });
    return list;
  }
  function getValue(elements) {
    const element = elements[0];
    if (element.type === "radio" || element.type === "checkbox") {
      const checked = elements.filter((e) => (e.type === "radio" || e.type === "checkbox") && e.checked);
      return checked.length > 0 ? checked[0].value : "";
    }
    if (element.tagName === "SELECT" && element.multiple) {
      return Array.from(element.selectedOptions).map((o) => o.value).join(",");
    }
    if (element.type === "file") {
      return element.files && element.files.length > 0 ? element.files[0].name : "";
    }
    return String(element.value == null ? "" : element.value).replace(/\r/g, "");
  }
  function isIgnored(element, elements) {
    if (element.disabled || element.type === "hidden") {
      return true;
    }
    return !elements.some((e) => e.offsetWidth > 0 || e.offsetHeight > 0 || e.getClientRects().length > 0);
  }

  // src/validation/jquery.js
  function hasJQueryValidation() {
    const $ = window.jQuery;
    return !!($ && $.validator && $.validator.unobtrusive);
  }
  function createJQueryEngine() {
    return {
      name: "jquery",
      async validate(form, options) {
        const $form = window.jQuery(form);
        const validator = getValidator(form, options);
        let valid = $form.valid();
        if (validator && validator.pendingRequest > 0) {
          await waitFor(() => validator.pendingRequest === 0, 3e4);
          valid = $form.valid();
        }
        return valid;
      },
      validateElement(form, element, options) {
        const validator = getValidator(form, options);
        return Promise.resolve(!validator || window.jQuery(element).valid());
      },
      showErrors(form, errors, options) {
        const validator = getValidator(form, options);
        const map = {};
        const unplaced = [];
        errors.forEach((error) => {
          if (!error.propertyName) {
            return;
          }
          const element = fieldElements(form, error.propertyName)[0];
          if (validator && element && messageElements(form, element.name).length > 0) {
            map[element.name] = error.messages.map(escapeHtml).join("<br>");
          } else {
            unplaced.push(...error.messages);
          }
        });
        if (validator && Object.keys(map).length > 0) {
          validator.showErrors(map);
        }
        return unplaced;
      },
      clear(form, options) {
        const validator = window.jQuery(form).data("validator");
        if (validator) {
          validator.resetForm();
        }
        clearAllErrors(form, options);
      },
      focusInvalid(form) {
        const validator = window.jQuery(form).data("validator");
        if (validator) {
          validator.focusInvalid();
        }
      }
    };
  }
  function waitFor(condition, timeout) {
    return new Promise((resolve) => {
      const started = Date.now();
      const timer = setInterval(() => {
        if (condition() || Date.now() - started > timeout) {
          clearInterval(timer);
          resolve();
        }
      }, 50);
    });
  }
  function getValidator(form, options) {
    const $ = window.jQuery;
    const $form = $(form);
    protectJQueryValidation();
    if (!$form.data("validator")) {
      $.validator.unobtrusive.parse(form);
    }
    const validator = $form.data("validator");
    if (validator) {
      addNewFields(form, validator);
      if (!validator.formhelperHooked) {
        validator.formhelperHooked = true;
        addCssClassHooks(form, validator, options);
      }
    }
    return validator;
  }
  function addNewFields(form, validator) {
    const $ = window.jQuery;
    const settings = validator.settings;
    settings.rules = settings.rules || {};
    settings.messages = settings.messages || {};
    form.querySelectorAll('[data-val="true"]').forEach((element) => {
      if (!element.name || Object.prototype.hasOwnProperty.call(settings.rules, element.name)) {
        return;
      }
      $.validator.unobtrusive.parseElement(element, true);
      const info = $(form).data("unobtrusiveValidation");
      settings.rules[element.name] = info && info.options.rules[element.name] || {};
      settings.messages[element.name] = info && info.options.messages[element.name] || {};
    });
  }
  function protectJQueryValidation() {
    const $ = window.jQuery;
    if (!$ || !$.validator) {
      return;
    }
    guardRegexMethod();
    if (!$.validator.formhelperRemoteEscaped) {
      $.validator.formhelperRemoteEscaped = true;
      escapeRemoteMessages($);
    }
  }
  function escapeRemoteMessages($) {
    $.ajaxPrefilter((options) => {
      if (typeof options.port !== "string" || options.port.indexOf("validate") !== 0) {
        return;
      }
      const dataFilter = options.dataFilter;
      options.dataFilter = function(data, type) {
        data = dataFilter ? dataFilter.call(this, data, type) : data;
        try {
          const response = JSON.parse(data);
          return typeof response === "string" ? JSON.stringify(escapeHtml(response)) : data;
        } catch (e) {
          return data;
        }
      };
    });
  }
  function guardRegexMethod() {
    const methods = window.jQuery.validator.methods;
    const regex = methods.regex;
    if (!regex || regex.formhelperGuarded) {
      return;
    }
    methods.regex = function(value, element, params) {
      try {
        return regex.call(this, value, element, params);
      } catch (e) {
        if (!(e instanceof SyntaxError)) {
          throw e;
        }
        console.warn("FormHelper: the pattern of " + element.name + " is not valid in JavaScript; it is validated on the server only.", e);
        return true;
      }
    };
    methods.regex.formhelperGuarded = true;
  }
  function addCssClassHooks(form, validator, options) {
    const settings = validator.settings;
    const highlight = settings.highlight;
    const unhighlight = settings.unhighlight;
    settings.highlight = function(element, errorClass, validClass) {
      if (highlight) {
        highlight.call(this, element, errorClass, validClass);
      }
      element.classList.add(...classList(options.inputErrorClass));
      messageElements(form, element.name).forEach((m) => m.classList.add(...classList(options.messageErrorClass)));
    };
    settings.unhighlight = function(element, errorClass, validClass) {
      if (unhighlight) {
        unhighlight.call(this, element, errorClass, validClass);
      }
      element.classList.remove(...classList(options.inputErrorClass));
      messageElements(form, element.name).forEach((m) => m.classList.remove(...classList(options.messageErrorClass)));
    };
  }

  // src/core.js
  var engines = {
    builtin: createBuiltInEngine(true),
    none: createBuiltInEngine(false),
    jquery: createJQueryEngine()
  };
  var busyForms = /* @__PURE__ */ new WeakSet();
  function getEngine(options) {
    const mode = options.validation;
    if (mode === "none" || mode === "builtin") {
      return engines[mode];
    }
    if (hasJQueryValidation()) {
      return engines.jquery;
    }
    if (mode === "jquery") {
      console.warn('FormHelper: validation is set to "jquery" but jQuery Validation Unobtrusive was not found; the built-in validator is used.');
    }
    return engines.builtin;
  }
  var statusTypes = { 1: "success", 2: "info", 3: "warning", 4: "error", success: "success", info: "info", warning: "warning", error: "error" };
  function statusType(result) {
    return statusTypes[String(result.status).toLowerCase()] || (isSucceed(result) ? "success" : "error");
  }
  function isFormResult(result) {
    return !!result && typeof result === "object" && (typeof result.isSucceed === "boolean" || String(result.status).toLowerCase() in statusTypes);
  }
  function isSucceed(result) {
    if (typeof result.isSucceed === "boolean") {
      return result.isSucceed;
    }
    const status = String(result.status).toLowerCase();
    return status === "1" || status === "2" || status === "success" || status === "info";
  }
  function notify2(type, message, form, options, toastOptions) {
    if (!message || options.notify === false) {
      return;
    }
    if (typeof options.notify === "function") {
      options.notify({ type, message, form });
      return;
    }
    const small = window.matchMedia && window.matchMedia("(max-width: 767.98px)").matches;
    toastr[type](message, null, Object.assign({
      positionClass: small ? "formhelper-toast-top-full-width" : options.toastrPosition
    }, toastOptions));
  }
  function submitButtons(form) {
    return Array.from(form.elements).filter((e) => e.tagName === "BUTTON" && (e.type || "submit").toLowerCase() === "submit" || e.tagName === "INPUT" && (e.type === "submit" || e.type === "image"));
  }
  function lockButtons(form) {
    const locked = submitButtons(form).filter((b) => !b.disabled);
    locked.forEach((b) => b.disabled = true);
    form.formhelperLockedButtons = locked;
  }
  function unlockButtons(form) {
    (form.formhelperLockedButtons || []).forEach((b) => b.disabled = false);
    form.formhelperLockedButtons = [];
  }
  async function readResponse(response) {
    const text = await response.text();
    let result = null;
    if ((response.headers.get("Content-Type") || "").indexOf("json") !== -1) {
      try {
        result = JSON.parse(text);
      } catch (e) {
        result = null;
      }
    }
    return { text, result };
  }
  async function submitForm(form, submitter) {
    if (busyForms.has(form)) {
      return;
    }
    const options = getFormOptions(form);
    const engine = getEngine(options);
    const skipValidation = submitter && submitter.hasAttribute("formnovalidate");
    busyForms.add(form);
    try {
      if (!skipValidation) {
        const valid = await engine.validate(form, options);
        if (!valid) {
          notify2("error", options.checkMessage, form, options);
          engine.focusInvalid(form);
          dispatch(form, "invalid", { form });
          return;
        }
      }
      const request = buildRequest(form, options, submitter);
      const beforeSubmit = resolveFunction(options.beforeSubmit);
      if (beforeSubmit && await beforeSubmit(form, request) === false) {
        return;
      }
      if (!dispatch(form, "before-submit", { form, request }, true)) {
        return;
      }
      lockButtons(form);
      let response = null;
      let result = null;
      let body = "";
      try {
        response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          credentials: "same-origin"
        });
        ({ text: body, result } = await readResponse(response));
      } catch (error) {
        console.error("FormHelper: the request failed.", error);
      }
      if (!isFormResult(result) && response && response.redirected && response.ok) {
        window.location.replace(response.url);
        return;
      }
      if (!isFormResult(result)) {
        if (response) {
          console.error("FormHelper: unexpected response (" + response.status + ").", body);
        }
        unlockButtons(form);
        notify2("error", options.errorMessage, form, options);
        dispatch(form, "error", { form, result: null, response });
        dispatch(form, "complete", { form, result: null, response });
        return;
      }
      handleResult(form, options, engine, result, response);
    } finally {
      busyForms.delete(form);
    }
  }
  function handleResult(form, options, engine, result, response) {
    clearAllErrors(form, options);
    const succeed = isSucceed(result);
    const errors = normalizeErrors(result.validationErrors);
    const hasMessage = typeof result.message === "string" && result.message !== "";
    const toastOptions = result.redirectUri ? { timeOut: 0, extendedTimeOut: 0 } : void 0;
    if (hasMessage) {
      notify2(statusType(result), result.message, form, options, toastOptions);
    } else if (!succeed) {
      notify2("error", options.checkMessage, form, options, toastOptions);
    }
    if (!succeed) {
      unlockButtons(form);
    }
    if (errors.length > 0) {
      const unplaced = engine.showErrors(form, errors, options);
      if (getSummary(form)) {
        setSummary(form, errors.reduce((all, e) => all.concat(e.messages), []));
      } else if (unplaced.length > 0) {
        notify2("error", unplaced.join("\n"), form, options);
      }
      engine.focusInvalid(form);
    }
    const callback = resolveFunction(options.callback);
    if (callback) {
      callback(result, form);
    }
    dispatch(form, succeed ? "success" : "error", { form, result, response });
    dispatch(form, "complete", { form, result, response });
    if (result.redirectUri) {
      const delay = hasMessage ? result.redirectDelay || options.redirectDelay : 1;
      setTimeout(() => window.location.replace(result.redirectUri), delay);
    }
    if (succeed) {
      if (options.enableButtonAfterSuccess) {
        unlockButtons(form);
      }
      if (options.resetFormAfterSuccess) {
        resetValues(form);
        engine.clear(form, options);
      }
    }
  }
  function normalizeErrors(errors) {
    if (!errors) {
      return [];
    }
    const list = Array.isArray(errors) ? errors : Object.keys(errors).map((key) => ({ propertyName: key, messages: errors[key] }));
    return list.map((e) => {
      const messages = e.messages;
      return {
        propertyName: normalizeFieldName(e.propertyName),
        messages: (Array.isArray(messages) ? messages : [messages]).filter((m) => m != null && m !== "").map(String)
      };
    }).filter((e) => e.messages.length > 0);
  }
  function resetValues(form) {
    form.formhelperResetting = true;
    try {
      form.reset();
    } finally {
      form.formhelperResetting = false;
    }
  }
  function resetForm(form) {
    const options = getFormOptions(form);
    resetValues(form);
    getEngine(options).clear(form, options);
    unlockButtons(form);
    submitButtons(form).forEach((b) => b.disabled = false);
  }
  function onSubmit(event) {
    const form = event.target;
    if (!isFormHelperForm(form) || event.defaultPrevented) {
      return;
    }
    event.preventDefault();
    submitForm(form, event.submitter || null);
  }
  function onFocusOut(event) {
    const element = event.target;
    const form = element && element.form;
    if (!isFormHelperForm(form) || !element.name || element.getAttribute("data-val") !== "true") {
      return;
    }
    const options = getFormOptions(form);
    getEngine(options).validateElement(form, element, options);
  }
  function onInput(event) {
    const element = event.target;
    const form = element && element.form;
    if (!isFormHelperForm(form) || !element.name) {
      return;
    }
    const options = getFormOptions(form);
    const engine = getEngine(options);
    if (engine.name !== "jquery" && element.getAttribute("aria-invalid") === "true") {
      engine.validateElement(form, element, options);
    }
  }
  function onReset(event) {
    const form = event.target;
    if (isFormHelperForm(form) && !form.formhelperResetting) {
      const options = getFormOptions(form);
      setTimeout(() => getEngine(options).clear(form, options), 0);
    }
  }
  var initialized = false;
  var FormHelper = {
    version: "6.0.0",
    init() {
      if (initialized) {
        return;
      }
      initialized = true;
      document.addEventListener("submit", onSubmit, true);
      document.addEventListener("focusout", onFocusOut);
      document.addEventListener("input", onInput);
      document.addEventListener("change", onInput);
      document.addEventListener("reset", onReset);
    },
    // Defaults for all forms, e.g. FormHelper.configure({ notify: false, errorMessage: "..." }).
    // toastr: default options of the notifications, e.g. { toastr: { closeButton: true } }.
    configure(options) {
      const _a = options || {}, { toastr: toastrOptions } = _a, rest = __objRest(_a, ["toastr"]);
      Object.assign(globals, rest);
      if (toastrOptions) {
        Object.assign(toastr.options, toastrOptions);
      }
    },
    submit(target) {
      const form = toForm(target);
      return form ? submitForm(form, null) : Promise.resolve();
    },
    validate(target) {
      const form = toForm(target);
      if (!form) {
        return Promise.resolve(false);
      }
      const options = getFormOptions(form);
      return getEngine(options).validate(form, options);
    },
    reset(target) {
      const form = toForm(target);
      if (form) {
        resetForm(form);
      }
    },
    fill(target, data, callbacks) {
      const form = toForm(target);
      if (form) {
        fillForm(form, data, callbacks);
      }
    },
    // Shows errors in FormResult's format: [{ propertyName, messages }] or { name: "message" }.
    showErrors(target, errors) {
      const form = toForm(target);
      if (!form) {
        return;
      }
      const options = getFormOptions(form);
      const engine = getEngine(options);
      const list = normalizeErrors(errors);
      engine.showErrors(form, list, options);
      setSummary(form, list.reduce((all, e) => all.concat(e.messages), []));
    },
    validation: {
      // FormHelper.validation.addRule("mustbetrue", (value, element, params) => element.checked)
      addRule
    },
    toastr
  };

  // src/index.js
  function registerJQuery() {
    const $ = window.jQuery;
    if (!$ || !$.fn) {
      return;
    }
    if (!$.parseJSON) {
      $.parseJSON = JSON.parse;
    }
    protectJQueryValidation();
    if ($.formhelperRegistered) {
      return;
    }
    $.formhelperRegistered = true;
    $(document).on("submit.formhelper", "form[data-formhelper]", function(event) {
      if (event.originalEvent) {
        return;
      }
      event.preventDefault();
      window.FormHelper.submit(this);
    });
  }
  if (!window.FormHelper) {
    window.FormHelper = FormHelper;
    window.fhToastr = toastr;
    FormHelper.init();
    document.addEventListener("DOMContentLoaded", registerJQuery);
    window.addEventListener("load", registerJQuery);
  }
  registerJQuery();
})();
