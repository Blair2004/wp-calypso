/**
 * External dependencies
 */
import React from 'react';
import noop from 'lodash/noop';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import Popover from 'components/popover';
import { hasTouch } from 'lib/touch-detect';
import SiteSelector from 'components/site-selector';

module.exports = React.createClass( {
	displayName: 'SitesPopover',

	propTypes: {
		sites: React.PropTypes.object,
		context: React.PropTypes.object,
		visible: React.PropTypes.bool,
		onClose: React.PropTypes.func,
		position: React.PropTypes.string,
		id: React.PropTypes.string,
		groups: React.PropTypes.bool,
		className: React.PropTypes.string
	},

	getInitialState: function() {
		return {
			popoverVisible: false
		};
	},

	getDefaultProps: function() {
		return {
			visible: false,
			onClose: noop,
			position: 'bottom left',
			groups: false,
			siteQuerystring: false,
			className: ''
		};
	},

	componentDidMount: function() {
		this.updatePopoverVisibilityState();
	},

	componentDidUpdate: function( prevProps ) {
		if ( this.props.visible !== prevProps.visible ) {
			this.updatePopoverVisibilityState();
		}
	},

	updatePopoverVisibilityState: function() {
		this.setState( {
			popoverVisible: this.props.visible
		} );
	},

	render: function() {
		let classes = classnames(
			this.props.className,
			'popover__container sites-popover',
			this.props.header && 'has-header' );

		return (
			<Popover
				id={ this.props.id }
				isVisible={ this.props.visible }
				context={ this.props.context }
				onClose={ this.props.onClose }
				position={ this.props.position }
				className={ classes }>
				{ this.state.popoverVisible && this.props.header
					? <div className="sites-popover__header">
							{ this.props.header }
						</div>
					: null
				}
				{ this.state.popoverVisible
					? <SiteSelector
							sites={ this.props.sites }
							siteBasePath="/post"
							onSiteSelect={ this.props.onSiteSelect }
							showAddNewSite={ false }
							indicator={ false }
							autoFocus={ ! hasTouch() }
							groups={ true }
							onClose={ this.props.onClose } />
					: null
				}
			</Popover>
		);
	}
} );
