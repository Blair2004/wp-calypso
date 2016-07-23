/**
 * External dependencies
 */
import React, { Component } from 'react';
import { localize } from 'i18n-calypso';
import userFactory from 'lib/user';

/**
 * Internal dependencies
 */
import Notice from 'components/notice';
import NoticeAction from 'components/notice/notice-action';
import notices from 'notices';

const RESEND_IDLE = 0,
	RESEND_IN_PROGRESS = 1,
	RESEND_SUCCESS = 2,
	RESEND_ERROR = 3;

class HelpUnverifiedWarning extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			resendState: RESEND_IDLE,
		};
	}

	render() {
		const { resendState } = this.state;

		const resendStateToMessage = ( resendState ) => {
			switch ( resendState ) {
				case RESEND_IDLE:
					return this.props.translate( "Trouble activating your account? Just click this button and we'll resend the activation for you." );
				case RESEND_IN_PROGRESS:
					return '';
				case RESEND_SUCCESS:
					return this.props.translate( "Please check your email for an activation email and click the link to finish your signup." );
				case RESEND_ERROR:
					return this.props.translate( "Sorry that we've encountered an error on sending you an activation email. Please try again later." );
				default:
					return 'Unknown activation email resending state.';
			}
		};

		const resendEmail = () => {
			this.setState( {
				resendState: RESEND_IN_PROGRESS,
			} );

			userFactory().sendVerificationEmail()
				.then( () => {
					const nextResendState = RESEND_SUCCESS;

					this.setState( { resendState: nextResendState } )
					notices[ 'success' ]( resendStateToMessage( nextResendState ) );
				} )
				.catch( () => {
					const nextResendState = RESEND_ERROR;

					this.setState( { resendState: nextResendState } )
					notices[ 'error' ]( resendStateToMessage( nextResendState ) );
				} );
		};

		return (
			RESEND_IDLE === resendState &&
				<Notice
					className='help-unverified-warning__notice'
					status='is-warning'
					showDismiss={ false }
					text={ resendStateToMessage( resendState ) } >
						<NoticeAction href="#" onClick={ resendEmail } >
							{ this.props.translate( "Resend Email" ) }
						</NoticeAction>
				</Notice>
		);
	}
}

export default localize( HelpUnverifiedWarning );