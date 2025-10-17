"""
Create a test call-out to demonstrate the dashboard enhancements
"""

from app import app
from database import db
from models import TeamMember, PTORequest, CallOutRecord, get_eastern_time
from datetime import date

with app.app_context():
    print("Creating test call-out...")

    # Get an employee (using John Smith from sample data)
    employee = TeamMember.query.filter_by(name='John Smith').first()

    if not employee:
        print("ERROR: No employees found. Please add employees first.")
        exit(1)

    # Get today's date
    today = get_eastern_time().date()
    today_str = today.strftime('%Y-%m-%d')

    # Create a test PTO request (call-out for today)
    test_pto_request = PTORequest(
        member_id=employee.id,
        start_date=today_str,
        end_date=today_str,
        pto_type='Sick Leave',
        manager_team=employee.team,
        status='pending',
        is_call_out=True,
        reason='Test call-out via phone - Feeling sick today'
    )

    db.session.add(test_pto_request)
    db.session.flush()  # Get the ID

    print(f"[OK] Created PTO request #{test_pto_request.id} for {employee.name}")

    # Create a test call-out record (VOICE CALL example)
    test_callout_voice = CallOutRecord(
        member_id=employee.id,
        pto_request_id=test_pto_request.id,
        call_sid='TEST_CALL_SID_12345',
        recording_url='https://api.twilio.com/2010-04-01/Accounts/ACxxxx/Recordings/RExxxx',  # Example URL
        recording_duration=87,  # 1 minute 27 seconds
        source='phone',
        phone_number_used=employee.phone or '+15551234567',
        verified=True,
        authentication_method='phone_match',
        message_text=None,
        processed_at=get_eastern_time()
    )

    db.session.add(test_callout_voice)
    print(f"[OK] Created call-out record (VOICE) for request #{test_pto_request.id}")

    # Create another employee's SMS call-out
    employee2 = TeamMember.query.filter_by(name='Sarah Johnson').first()
    if employee2:
        test_pto_request2 = PTORequest(
            member_id=employee2.id,
            start_date=today_str,
            end_date=today_str,
            pto_type='Sick Leave',
            manager_team=employee2.team,
            status='pending',
            is_call_out=True,
            reason='Test call-out via SMS - Not feeling well'
        )

        db.session.add(test_pto_request2)
        db.session.flush()

        print(f"[OK] Created PTO request #{test_pto_request2.id} for {employee2.name}")

        # Create SMS call-out record
        test_callout_sms = CallOutRecord(
            member_id=employee2.id,
            pto_request_id=test_pto_request2.id,
            call_sid='TEST_SMS_SID_67890',
            recording_url=None,
            recording_duration=None,
            source='sms',
            phone_number_used=employee2.phone or '+15559876543',
            verified=True,
            authentication_method='phone_match',
            message_text='Calling out sick today - stomach flu. Will update tomorrow morning.',
            processed_at=get_eastern_time()
        )

        db.session.add(test_callout_sms)
        print(f"[OK] Created call-out record (SMS) for request #{test_pto_request2.id}")

    # Commit all changes
    db.session.commit()

    print("\n" + "="*60)
    print("SUCCESS: Test call-outs created!")
    print("="*60)
    print("\nNow you can:")
    print("1. Go to: http://127.0.0.1:5000/login")
    print("2. Login as a manager (see credentials below)")
    print("3. Go to Dashboard")
    print("4. Click 'Call-Outs Only' filter button")
    print("5. Click 'View Details' on the call-out requests")
    print()
    print("Manager Login Credentials:")
    print("  Admin Manager: admin.manager@mswcvi.com / admin123")
    print("  Clinical Manager: clinical.manager@mswcvi.com / clinical123")
    print()
    print("You should see:")
    print("  - Red 'CALL OUT' badges")
    print("  - 'View Details' links")
    print("  - Expandable details with:")
    print("    * Phone/SMS badges")
    print("    * Authentication info")
    print("    * Recording player (for voice)")
    print("    * SMS message (for text)")
    print()
