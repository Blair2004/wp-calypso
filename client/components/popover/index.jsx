/**
 * External dependencies
 */
import React, { PropTypes, Component } from 'react';
import ReactDOM from 'react-dom';
import debugFactory from 'debug';
import classNames from 'classnames';
import clickOutside from 'click-outside';
import uid from 'component-uid';

window.uid = uid;
/**
 * Internal dependencies
 */
import RootChild from 'components/root-child';
import {
	bindWindowListeners,
	unbindWindowListeners,

	suggested as suggestPosition,
	constrainLeft,
	isElement as isDOMElement,
	offset
} from './util';

/**
 * Module variables
 */
const noop = () => {};
const debug = debugFactory( 'calypso:popover' );
const __popovers = new Set();
let __popoverNumber = 0;

class Popover extends Component {
	constructor() {
		super();

		// bound methods
		this.setDOMBehavior = this.setDOMBehavior.bind( this );
		this.setPosition = this.setPosition.bind( this );
		this.onPopoverClickout = this.onPopoverClickout.bind( this );
		this.onKeydown = this.onKeydown.bind( this );
		this.onWindowChange = this.onWindowChange.bind( this );

		this.state = {
			left: -99999,
			top: -99999,
			positionClass: `popover-${ Popover.defaultProps.top }`
		};
	}

	componentWillMount() {
		this.id = this.props.id || `pop__${ uid( 16 ) }`;
		__popovers.add( this.id );
		__popoverNumber++;
		this.debug( 'init' );
		debug( 'current popover instances: ', __popovers.size );
	}

	componentDidMount() {
		this.bindEscKeyListener();
		this.bindDebouncedReposition();
		bindWindowListeners();
	}

	componentWillReceiveProps( nextProps ) {
		this.debug( 'componentWillReceiveProps' );

		if ( ! this.domContainer ) {
			return null;
		}

		if ( ! nextProps.isVisible ) {
			return null;
		}

		// store context (target) reference into a property
		if ( ! isDOMElement( nextProps.context ) ) {
			this.domContext = ReactDOM.findDOMNode( nextProps.context );
		} else {
			this.domContext = nextProps.context;
		}

		this.setPosition();

		if ( ! this._unbindClickHandler ) {
			if ( nextProps.isVisible ) {
				this.bindClickoutHandler();
			} else {
				this.unbindClickoutHandler();
			}
		}
	}

	componentDidUpdate() {
		this.debug( 'componentDidUpdate' );
		this.debug( 'this.domContext: %o', this.domContext );
	}

	componentWillUnmount() {
		this.debug( 'unmounting .... ' );
		this.unbindClickoutHandler();
		this.unbindDebouncedReposition();
		this.unbindEscKeyListener();
		__popovers.delete( this.id );
		unbindWindowListeners();
		debug( 'current popover instances: ', __popovers.size );
	}

	debug( string, ...args ) {
		debug( `[%s] ${ string }`, this.id, ...args );
	}

	// --- ESC key ---
	bindEscKeyListener() {
		if ( ! this.props.closeOnEsc ) {
			return null;
		}

		if ( this.escEventHandlerAdded ) {
			return null;
		}

		this.debug( 'adding escKey handler ...' );
		this.escEventHandlerAdded = true;
		document.addEventListener( 'keydown', this.onKeydown, true );
	}

	unbindEscKeyListener() {
		if ( ! this.props.closeOnEsc ) {
			return null;
		}

		if ( ! this.escEventHandlerAdded ) {
			return null;
		}

		this.debug( 'unbinding `escKey` listener ...' );
		document.removeEventListener( 'keydown', this.onKeydown, true );
	}

	onKeydown( event ) {
		if ( event.keyCode !== 27 ) {
			return null;
		}

		this.close();
	}

	// --- cliclout side ---
	bindClickoutHandler( el = this.domContainer ) {
		if ( this._unbindClickHandler ) {
			this.debug( 'clickout event already bound' );
			return null;
		}

		this.debug( 'binding `clickout` event' );
		this._unbindClickHandler = clickOutside( el, this.onPopoverClickout );
	}

	unbindClickoutHandler() {
		if ( this._unbindClickHandler ) {
			this.debug( 'unbinding `clickout` listener ...' );
			this._unbindClickHandler();
			this._unbindClickHandler = null;
		}
	}

	onPopoverClickout() {
		this.close();
	}

	// --- window `scroll` and `resize` ---
	bindDebouncedReposition() {
		window.addEventListener( 'scroll', this.onWindowChange, true );
		window.addEventListener( 'resize', this.onWindowChange, true );
	}

	unbindDebouncedReposition() {
		if ( this.willReposition ) {
			window.cancelAnimationFrame( this.willReposition );
			this.willReposition = null;
		}

		window.removeEventListener( 'scroll', this.onWindowChange, true );
		window.removeEventListener( 'resize', this.onWindowChange, true );
		this.debug( 'unbinding `debounce reposition` ...' );
	}

	onWindowChange() {
		this.willReposition = window.requestAnimationFrame( this.setPosition );
	}

	setDOMBehavior( domContainer ) {
		if ( ! domContainer ) {
			return null;
		}

		this.debug( 'setting DOM behavior' );

		// store DOM element referencies
		this.domContainer = domContainer;

		// store context (target) reference into a property
		if ( ! isDOMElement( this.props.context ) ) {
			this.domContext = ReactDOM.findDOMNode( this.props.context );
		} else {
			this.domContext = this.props.context;
		}

		this.setPosition();

		this.bindClickoutHandler( domContainer );
	}

	getPositionClass( position = this.props.position ) {
		return `popover-${ position.replace( /\s+/g, '-' ) }`;
	}

	/**
	 * Computes the position of the Popover in function
	 * of its main container and the target.
	 *
	 * @return {Object} reposition parameters
	 */
	computePosition() {
		if ( ! this.props.isVisible ) {
			return null;
		}

		const { domContainer, domContext } = this;
		const { position } = this.props;

		if ( ! domContainer || ! domContext ) {
			this.debug( '[WARN] no DOM elements to work' );
			return null;
		}

		const suggestedPosition = suggestPosition( position, domContainer, domContext );

		this.debug( 'suggested position: %o', suggestedPosition );

		const reposition = Object.assign(
			{},
			constrainLeft(
				offset( suggestedPosition, domContainer, domContext ),
				domContainer
			),
			{ positionClass: this.getPositionClass( suggestedPosition ) }
		);

		this.debug( 'updating reposition: ', reposition );

		return reposition;
	}

	setPosition() {
		const position = this.computePosition();
		if ( ! position ) {
			return null;
		}

		this.willReposition = null;
		this.setState( position );
	}

	getStylePosition() {
		const { left, top } = this.state;
		return { left, top };
	}

	close() {
		if ( ! this.props.isVisible ) {
			this.debug( 'popover should be already closed' );
			return null;
		}

		this.props.onClose();
	}

	render() {
		const { isVisible, context, className } = this.props;

		if ( ! isVisible ) {
			this.debug( 'Popover is not visible.' );
			return null;
		}

		if ( ! context ) {
			this.debug( 'No `context` to tie the Popover' );
			return null;
		}

		const classes = classNames(
			className,
			this.state.positionClass
		);

		this.debug( 'rendering ...' );

		return (
			<RootChild>
				<div
					style={ this.getStylePosition() }
					className={ classes }
					ref={ this.setDOMBehavior }
				>
					<div className="popover__arrow" />

					<div className="popover__inner">
						{ this.props.children }
					</div>
				</div>
			</RootChild>
		);
	}
}

Popover.propTypes = {
	className: PropTypes.string,
	closeOnEsc: PropTypes.bool,
	position: PropTypes.string,
	id: PropTypes.string,

	onClose: PropTypes.func.isRequired,
	onShow: PropTypes.func,
};

Popover.defaultProps = {
	className: 'popover__container',
	closeOnEsc: true,
	position: 'top',
	isVisible: false,
	onShow: noop,
};

export default Popover;
