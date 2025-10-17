"""
Twilio Webhook Routes for Call-Out Feature
Handles incoming voice calls and SMS messages from Twilio
"""

from flask import request, session
from twilio_service import TwilioVoiceService, TwilioSMSService
from email_service import EmailService
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def register_twilio_routes(app):
    """Register Twilio webhook routes with the Flask app"""

    # Initialize services
    voice_service = TwilioVoiceService()
    sms_service = TwilioSMSService()
    email_service = EmailService()

    # ========================================
    # VOICE CALL ROUTES
    # ========================================

    @app.route('/twilio/voice/incoming', methods=['POST'])
    def twilio_voice_incoming():
        """
        Entry point for incoming voice calls
        Twilio calls this webhook when someone calls the call-out line
        """
        logger.info("Incoming voice call received")

        # Get caller information from Twilio request
        from_number = request.form.get('From', '')
        call_sid = request.form.get('CallSid', '')

        logger.info(f"Call from: {from_number}, SID: {call_sid}")

        # Store call info in session for later use
        session['call_sid'] = call_sid
        session['from_number'] = from_number

        # Generate greeting TwiML (handles authentication)
        twiml_response = voice_service.generate_greeting_twiml(from_number)

        return twiml_response, 200, {'Content-Type': 'text/xml'}

    @app.route('/twilio/voice/authenticate-pin', methods=['POST'])
    def twilio_voice_authenticate_pin():
        """
        Handle PIN authentication after user enters digits
        """
        logger.info("PIN authentication request received")

        # Get PIN digits entered by caller
        pin = request.form.get('Digits', '')
        from_number = session.get('from_number', request.form.get('From', ''))

        logger.info(f"Authenticating PIN for {from_number}")

        # Store authenticated member info in session if successful
        authenticated, member, method = voice_service.authenticate_caller(from_number, pin=pin)

        if authenticated:
            session['authenticated_member_id'] = member.id
            session['authentication_method'] = method

        # Generate TwiML response
        twiml_response = voice_service.generate_pin_authentication_twiml(pin, from_number)

        return twiml_response, 200, {'Content-Type': 'text/xml'}

    @app.route('/twilio/voice/record', methods=['POST'])
    def twilio_voice_record():
        """
        Start recording the call-out message
        This route is called after successful authentication
        """
        logger.info("Starting call-out recording")

        # Generate TwiML to record message
        twiml_response = voice_service.generate_recording_twiml()

        return twiml_response, 200, {'Content-Type': 'text/xml'}

    @app.route('/twilio/voice/process-recording', methods=['POST'])
    def twilio_voice_process_recording():
        """
        Process the completed recording and create PTO request
        Twilio calls this after recording is finished
        """
        logger.info("Processing completed recording")

        # Get recording information from Twilio
        recording_url = request.form.get('RecordingUrl', '')
        recording_duration = request.form.get('RecordingDuration', '0')
        call_sid = request.form.get('CallSid', session.get('call_sid', ''))
        from_number = request.form.get('From', session.get('from_number', ''))

        logger.info(f"Recording URL: {recording_url}")
        logger.info(f"Duration: {recording_duration} seconds")

        try:
            # Authenticate caller (should already be authenticated from previous steps)
            authenticated, member, method = voice_service.authenticate_caller(from_number)

            # Check if we have authenticated member from session
            if not authenticated and 'authenticated_member_id' in session:
                from models import TeamMember
                member = TeamMember.query.get(session['authenticated_member_id'])
                method = session.get('authentication_method', 'unknown')
                authenticated = True

            if not authenticated or not member:
                logger.error("Failed to authenticate caller during recording processing")
                twiml_response = voice_service.generate_confirmation_twiml(0)
                return twiml_response, 200, {'Content-Type': 'text/xml'}

            # Create PTO request and CallOutRecord
            pto_request = voice_service.create_call_out_request(
                member=member,
                call_sid=call_sid,
                recording_url=recording_url,
                from_number=from_number,
                authentication_method=method
            )

            # Send confirmation SMS to employee
            voice_service.send_confirmation_sms(from_number, pto_request.id, member.name)

            # Send email notification to manager
            try:
                email_service.send_submission_email(pto_request)
            except Exception as e:
                logger.error(f"Failed to send email notification: {str(e)}")

            # Generate confirmation TwiML
            twiml_response = voice_service.generate_confirmation_twiml(pto_request.id)

            # Clear session
            session.pop('call_sid', None)
            session.pop('from_number', None)
            session.pop('authenticated_member_id', None)
            session.pop('authentication_method', None)

            return twiml_response, 200, {'Content-Type': 'text/xml'}

        except Exception as e:
            logger.error(f"Error processing recording: {str(e)}")
            twiml_response = voice_service.generate_confirmation_twiml(0)
            return twiml_response, 200, {'Content-Type': 'text/xml'}

    @app.route('/twilio/voice/recording-status', methods=['POST'])
    def twilio_voice_recording_status():
        """
        Callback for recording status updates from Twilio
        This is called when recording is completed and available
        """
        recording_sid = request.form.get('RecordingSid', '')
        recording_url = request.form.get('RecordingUrl', '')
        recording_status = request.form.get('RecordingStatus', '')

        logger.info(f"Recording status update: {recording_status} - SID: {recording_sid}")

        # Could update CallOutRecord with final recording URL here if needed
        # For now, just log it

        return '', 200

    # ========================================
    # SMS ROUTES
    # ========================================

    @app.route('/twilio/sms/incoming', methods=['POST'])
    def twilio_sms_incoming():
        """
        Handle incoming SMS messages for call-outs
        Twilio calls this webhook when someone texts the call-out line
        """
        logger.info("Incoming SMS received")

        # Get SMS information from Twilio request
        from_number = request.form.get('From', '')
        message_body = request.form.get('Body', '')
        message_sid = request.form.get('MessageSid', '')

        logger.info(f"SMS from: {from_number}")
        logger.info(f"Message: {message_body}")
        logger.info(f"SID: {message_sid}")

        try:
            # Authenticate sender by phone number
            authenticated, member = sms_service.authenticate_sender(from_number)

            if not authenticated:
                logger.warning(f"SMS authentication failed for {from_number}")
                twiml_response = sms_service.generate_sms_response(
                    authenticated=False
                )
                return twiml_response, 200, {'Content-Type': 'text/xml'}

            # Create PTO request and CallOutRecord
            pto_request = sms_service.create_call_out_request(
                member=member,
                message_sid=message_sid,
                message_body=message_body,
                from_number=from_number
            )

            # Send email notification to manager
            try:
                email_service.send_submission_email(pto_request)
            except Exception as e:
                logger.error(f"Failed to send email notification: {str(e)}")

            # Optionally send SMS to manager (if configured)
            import os
            manager_team = member.team
            manager_sms = None

            if manager_team == 'admin':
                manager_sms = os.getenv('MANAGER_ADMIN_SMS')
            elif manager_team == 'clinical':
                manager_sms = os.getenv('MANAGER_CLINICAL_SMS')

            if manager_sms:
                sms_service.send_manager_notification_sms(
                    manager_sms,
                    member.name,
                    pto_request.id
                )

            # Generate SMS response to employee
            twiml_response = sms_service.generate_sms_response(
                authenticated=True,
                member=member,
                request_id=pto_request.id
            )

            return twiml_response, 200, {'Content-Type': 'text/xml'}

        except Exception as e:
            logger.error(f"Error processing SMS: {str(e)}")
            twiml_response = sms_service.generate_sms_response(
                authenticated=False
            )
            return twiml_response, 200, {'Content-Type': 'text/xml'}

    # ========================================
    # TEST/DEBUG ROUTES (optional)
    # ========================================

    @app.route('/twilio/test/voice')
    def test_voice_twiml():
        """Test endpoint to see what TwiML looks like"""
        test_number = '+15551234567'
        twiml = voice_service.generate_greeting_twiml(test_number)
        return f"<pre>{twiml}</pre>", 200

    @app.route('/twilio/test/sms')
    def test_sms_twiml():
        """Test endpoint to see what SMS response looks like"""
        twiml = sms_service.generate_sms_response(
            authenticated=True,
            member=type('obj', (object,), {'name': 'Test Employee'}),
            request_id=123
        )
        return f"<pre>{twiml}</pre>", 200

    logger.info("Twilio routes registered successfully")
