"""
Twilio Service Layer for Call-Out Feature
Handles voice calls and SMS for employee call-out reporting
"""

import os
import logging
from datetime import datetime, date
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
from twilio.twiml.messaging_response import MessagingResponse
from models import TeamMember, PTORequest, CallOutRecord, get_eastern_time
from database import db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TwilioVoiceService:
    """Service for handling incoming voice calls for call-outs"""

    def __init__(self):
        """Initialize Twilio Voice service with credentials from environment"""
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.phone_number = os.getenv('TWILIO_PHONE_NUMBER')
        self.enable_recording = os.getenv('ENABLE_CALL_RECORDING', 'True').lower() == 'true'
        self.max_recording_length = int(os.getenv('CALL_RECORDING_MAX_LENGTH', '120'))

        # Initialize Twilio client if credentials are available
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            self.client = None
            logger.warning("Twilio credentials not configured. Voice calls will not work.")

    def authenticate_caller(self, from_number, pin=None):
        """
        Authenticate caller by phone number match or PIN
        Returns: (authenticated, member, method) tuple
        """
        # Normalize phone number (remove +1, spaces, dashes)
        normalized_number = from_number.replace('+1', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')

        # Try phone number match first
        member = TeamMember.query.filter(
            db.func.replace(db.func.replace(db.func.replace(TeamMember.phone, '-', ''), ' ', ''), '+1', '') == normalized_number
        ).first()

        if member:
            logger.info(f"Authenticated {member.name} by phone match: {from_number}")
            return (True, member, 'phone_match')

        # If phone match failed and PIN provided, try PIN authentication
        if pin:
            member = TeamMember.query.filter_by(pin=pin).first()
            if member:
                logger.info(f"Authenticated {member.name} by PIN: {pin}")
                return (True, member, 'pin')

        logger.warning(f"Authentication failed for {from_number}")
        return (False, None, None)

    def generate_greeting_twiml(self, from_number):
        """Generate TwiML for initial greeting"""
        response = VoiceResponse()

        # Try to authenticate by phone number first
        authenticated, member, method = self.authenticate_caller(from_number)

        if authenticated:
            # Phone match successful - skip PIN
            response.say(
                f"Welcome to M S W C V I Call-Out Line. Hello {member.name}. You have been authenticated.",
                voice='alice'
            )
            # Redirect to recording
            response.redirect(url='/twilio/voice/record', method='POST')
        else:
            # Phone not recognized - request PIN
            response.say(
                "Welcome to M S W C V I Call-Out Line. Please enter your 4-digit PIN followed by the pound key.",
                voice='alice'
            )
            gather = Gather(
                num_digits=4,
                finish_on_key='#',
                action='/twilio/voice/authenticate-pin',
                method='POST'
            )
            response.append(gather)

            # If no input, repeat
            response.say("We did not receive your PIN. Please try again.", voice='alice')
            response.redirect(url='/twilio/voice/incoming', method='POST')

        return str(response)

    def generate_pin_authentication_twiml(self, pin, from_number):
        """Generate TwiML after PIN entry"""
        response = VoiceResponse()

        authenticated, member, method = self.authenticate_caller(from_number, pin=pin)

        if authenticated:
            response.say(f"Authentication successful. Hello {member.name}.", voice='alice')
            response.redirect(url='/twilio/voice/record', method='POST')
        else:
            response.say("Authentication failed. Invalid PIN.", voice='alice')
            response.pause(length=1)
            response.say("Please try again or contact your manager directly.", voice='alice')
            response.hangup()

        return str(response)

    def generate_recording_twiml(self):
        """Generate TwiML to start recording call-out message"""
        response = VoiceResponse()

        response.say(
            "Please state your reason for calling out sick today. When you are finished, press the pound key or hang up.",
            voice='alice'
        )

        # Record the message
        response.record(
            action='/twilio/voice/process-recording',
            method='POST',
            max_length=self.max_recording_length,
            finish_on_key='#',
            recording_status_callback='/twilio/voice/recording-status',
            recording_status_callback_method='POST',
            play_beep=True
        )

        return str(response)

    def generate_confirmation_twiml(self, request_id):
        """Generate TwiML for call-out confirmation"""
        response = VoiceResponse()

        response.say(
            f"Your call-out has been recorded. Request number {request_id}. You will receive a text message confirmation. Thank you.",
            voice='alice'
        )
        response.hangup()

        return str(response)

    def create_call_out_request(self, member, call_sid, recording_url, from_number, authentication_method):
        """
        Create PTO request and CallOutRecord for phone call-out
        Returns: PTORequest object
        """
        try:
            # Get today's date in Eastern time
            today = get_eastern_time().date()
            today_str = today.strftime('%Y-%m-%d')

            # Create PTO request for today only (Sick Leave, call-out)
            pto_request = PTORequest(
                member_id=member.id,
                start_date=today_str,
                end_date=today_str,
                pto_type='Sick Leave',
                manager_team=member.team,
                status='pending',
                is_call_out=True,
                reason=f"Call-out via phone - Recording available"
            )

            db.session.add(pto_request)
            db.session.flush()  # Get the PTO request ID

            # Create CallOutRecord
            call_out_record = CallOutRecord(
                member_id=member.id,
                pto_request_id=pto_request.id,
                call_sid=call_sid,
                recording_url=recording_url,
                source='phone',
                phone_number_used=from_number,
                verified=True,
                authentication_method=authentication_method,
                processed_at=get_eastern_time()
            )

            db.session.add(call_out_record)
            db.session.commit()

            logger.info(f"Created call-out request #{pto_request.id} for {member.name}")
            return pto_request

        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to create call-out request: {str(e)}")
            raise

    def send_confirmation_sms(self, to_number, request_id, employee_name):
        """Send SMS confirmation to employee"""
        if not self.client:
            logger.warning("Twilio client not initialized. Cannot send SMS.")
            return False

        try:
            message = self.client.messages.create(
                body=f"Call-out recorded, {employee_name}. Request #{request_id} has been submitted to your manager. Feel better!",
                from_=self.phone_number,
                to=to_number
            )
            logger.info(f"SMS confirmation sent to {to_number}: {message.sid}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS confirmation: {str(e)}")
            return False


class TwilioSMSService:
    """Service for handling incoming SMS for call-outs"""

    def __init__(self):
        """Initialize Twilio SMS service with credentials from environment"""
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.sms_number = os.getenv('TWILIO_SMS_NUMBER') or os.getenv('TWILIO_PHONE_NUMBER')

        # Initialize Twilio client if credentials are available
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            self.client = None
            logger.warning("Twilio credentials not configured. SMS will not work.")

    def authenticate_sender(self, from_number):
        """
        Authenticate SMS sender by phone number match
        Returns: (authenticated, member) tuple
        """
        # Normalize phone number
        normalized_number = from_number.replace('+1', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')

        # Try phone number match
        member = TeamMember.query.filter(
            db.func.replace(db.func.replace(db.func.replace(TeamMember.phone, '-', ''), ' ', ''), '+1', '') == normalized_number
        ).first()

        if member:
            logger.info(f"Authenticated SMS from {member.name}: {from_number}")
            return (True, member)

        logger.warning(f"SMS authentication failed for {from_number}")
        return (False, None)

    def extract_reason(self, message_body):
        """Extract call-out reason from SMS text"""
        # Clean up the message text
        reason = message_body.strip()

        # Remove common prefixes
        prefixes_to_remove = [
            "calling out",
            "call out",
            "calling in sick",
            "calling in",
            "sick today",
            "sick",
            "-",
            ":"
        ]

        reason_lower = reason.lower()
        for prefix in prefixes_to_remove:
            if reason_lower.startswith(prefix):
                reason = reason[len(prefix):].strip()
                reason_lower = reason.lower()

        return reason if reason else "Not specified"

    def generate_sms_response(self, authenticated, member=None, request_id=None):
        """Generate TwiML response for SMS"""
        response = MessagingResponse()

        if authenticated and member and request_id:
            response.message(
                f"Call-out recorded, {member.name}. Request #{request_id} has been submitted to your manager. Feel better!"
            )
        elif not authenticated:
            response.message(
                "Phone number not found in system. Please contact your manager directly or submit via the web app."
            )
        else:
            response.message(
                "Error processing call-out. Please contact your manager directly."
            )

        return str(response)

    def create_call_out_request(self, member, message_sid, message_body, from_number):
        """
        Create PTO request and CallOutRecord for SMS call-out
        Returns: PTORequest object
        """
        try:
            # Get today's date in Eastern time
            today = get_eastern_time().date()
            today_str = today.strftime('%Y-%m-%d')

            # Extract reason from SMS
            reason = self.extract_reason(message_body)

            # Create PTO request for today only (Sick Leave, call-out)
            pto_request = PTORequest(
                member_id=member.id,
                start_date=today_str,
                end_date=today_str,
                pto_type='Sick Leave',
                manager_team=member.team,
                status='pending',
                is_call_out=True,
                reason=f"Call-out via SMS: {reason}"
            )

            db.session.add(pto_request)
            db.session.flush()  # Get the PTO request ID

            # Create CallOutRecord
            call_out_record = CallOutRecord(
                member_id=member.id,
                pto_request_id=pto_request.id,
                call_sid=message_sid,
                source='sms',
                phone_number_used=from_number,
                verified=True,
                authentication_method='phone_match',
                message_text=message_body,
                processed_at=get_eastern_time()
            )

            db.session.add(call_out_record)
            db.session.commit()

            logger.info(f"Created SMS call-out request #{pto_request.id} for {member.name}")
            return pto_request

        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to create SMS call-out request: {str(e)}")
            raise

    def send_manager_notification_sms(self, manager_number, employee_name, request_id):
        """Send SMS notification to manager (optional feature)"""
        if not self.client or not manager_number:
            return False

        try:
            message = self.client.messages.create(
                body=f"URGENT: {employee_name} called out sick today. Request #{request_id}. Check your email for details.",
                from_=self.sms_number,
                to=manager_number
            )
            logger.info(f"Manager notification sent to {manager_number}: {message.sid}")
            return True
        except Exception as e:
            logger.error(f"Failed to send manager SMS: {str(e)}")
            return False
