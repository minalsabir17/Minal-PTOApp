# Twilio Call-Out Feature - Setup Guide

## Overview
This guide will help you set up and test the Twilio call-out feature for your PTO application. Employees will be able to call or text to report sick call-outs, which will automatically create PTO requests in the system.

---

## Phase 1: Twilio Account Setup

### Step 1: Create Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free trial account
3. Verify your email and phone number
4. Complete the account setup wizard

### Step 2: Get Your Twilio Credentials
1. Log in to Twilio Console: https://console.twilio.com
2. From your dashboard, copy:
   - **Account SID** (starts with AC...)
   - **Auth Token** (click to reveal)
3. Save these credentials securely - you'll need them next

### Step 3: Purchase a Phone Number
1. In Twilio Console, go to **Phone Numbers** → **Buy a Number**
2. Select your country (United States)
3. Check both **Voice** and **SMS** capabilities
4. Choose a phone number you like
5. Click **Buy** (free trial includes $15 credit)
6. Save this phone number - this will be your call-out line

---

## Phase 2: Configure Your Application

### Step 4: Create .env File
1. In your project folder, copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` file and update these values:
   ```env
   # Twilio Configuration
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+15551234567
   TWILIO_SMS_NUMBER=+15551234567

   ENABLE_CALL_RECORDING=True
   CALL_RECORDING_MAX_LENGTH=120
   ```

3. **IMPORTANT:** Never commit `.env` to version control!

### Step 5: Add Phone Numbers to Employees
You need to add phone numbers to employee records so the system can authenticate callers.

**Option A: Via Database (SQLite Browser)**
1. Download DB Browser for SQLite: https://sqlitebrowser.org/
2. Open `pto_tracker.db`
3. Go to **Browse Data** tab → `users` table
4. Add phone numbers in format: `+15551234567` (include country code)
5. Save changes

**Option B: Via Python Script**
```python
# add_phone_numbers.py
from app import app
from database import db
from models import TeamMember

with app.app_context():
    # Example: Add phone to John Smith
    john = TeamMember.query.filter_by(name='John Smith').first()
    if john:
        john.phone = '+15551234567'  # Replace with real number

    # Add more employees...

    db.session.commit()
    print("Phone numbers updated!")
```

Run: `python add_phone_numbers.py`

### Step 6: Set PINs for Employees (Optional)
PINs provide backup authentication when calling from an unknown number.

```python
# set_pins.py
from app import app
from database import db
from models import TeamMember

with app.app_context():
    john = TeamMember.query.filter_by(name='John Smith').first()
    if john:
        john.pin = '1234'  # 4-digit PIN

    db.session.commit()
    print("PINs set!")
```

---

## Phase 3: Configure Twilio Webhooks

Webhooks tell Twilio where to send incoming calls and SMS messages.

### Step 7: Expose Your Local Server (Development)

**Option A: Using ngrok (Recommended for Testing)**
1. Download ngrok: https://ngrok.com/download
2. Run: `ngrok http 5000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. This URL will be your webhook base

**Option B: Deploy to Production Server**
- Use your actual domain: `https://your-domain.com`

### Step 8: Configure Voice Webhook
1. Go to Twilio Console → **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on your call-out phone number
3. Scroll to **Voice Configuration**
4. Set **A CALL COMES IN**:
   - URL: `https://your-ngrok-url.ngrok.io/twilio/voice/incoming`
   - HTTP Method: `POST`
5. Click **Save**

### Step 9: Configure SMS Webhook
1. On the same phone number page
2. Scroll to **Messaging Configuration**
3. Set **A MESSAGE COMES IN**:
   - URL: `https://your-ngrok-url.ngrok.io/twilio/sms/incoming`
   - HTTP Method: `POST`
4. Click **Save**

---

## Phase 4: Testing

### Step 10: Start Your Flask App
```bash
cd c:\Users\minal\Minal-PTOApp
python app.py
```

Server should start on `http://127.0.0.1:5000`

### Step 11: Test Voice Call-Out

**Test 1: Phone Number Authentication**
1. Call your Twilio phone number from a phone that's registered in the system
2. You should hear: "Welcome to MSW CVI Call-Out Line. Hello [Your Name]..."
3. After the beep, state your reason for calling out
4. Press `#` when done
5. You should hear confirmation with a request number
6. Check your email for confirmation
7. Check manager email for notification with recording player

**Test 2: PIN Authentication**
1. Call from an unregistered phone number
2. You should hear: "Please enter your 4-digit PIN followed by #"
3. Enter your PIN using the phone keypad
4. After authentication, follow same steps as Test 1

### Step 12: Test SMS Call-Out

1. Send an SMS to your Twilio number with:
   ```
   Calling out sick - stomach flu
   ```

2. You should receive reply SMS:
   ```
   Call-out recorded, [Your Name]. Request #123 has been submitted to your manager. Feel better!
   ```

3. Check your email for confirmation
4. Check manager email for notification with SMS message

### Step 13: Verify in Dashboard

1. Log in to PTO app: http://127.0.0.1:5000/login
2. Go to dashboard
3. You should see a call-out request with red badge
4. Click to view details:
   - Should show "Call Out" badge
   - Should show source (phone/SMS)
   - For voice: Recording player
   - For SMS: Message text
   - Authentication method badge

---

## Phase 5: Production Deployment

### Step 14: Deploy to Production Server

1. **Upload files to your server**
   ```bash
   # Files to upload:
   - models.py (updated)
   - twilio_service.py (new)
   - routes_twilio.py (new)
   - email_service.py (updated)
   - app.py (updated)
   - requirements.txt (new)
   - .env (with production credentials)
   ```

2. **Install dependencies on server**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run migration on production database**
   ```bash
   python migrate_add_twilio_support.py
   ```

4. **Update Twilio webhooks with production URLs**
   - Voice: `https://your-production-domain.com/twilio/voice/incoming`
   - SMS: `https://your-production-domain.com/twilio/sms/incoming`

5. **Restart your Flask application**

### Step 15: Communicate to Staff

Send an email to all employees with:
```
Subject: New Feature: Call-Out Hotline

Dear Team,

We've launched a new call-out hotline for reporting sick days!

📞 CALL-OUT HOTLINE: [Your Twilio Number]

You can now report call-outs in two ways:

1. PHONE CALL:
   - Call the hotline number above
   - System will recognize your phone number OR ask for your PIN
   - Leave a voice message explaining your reason
   - Receive instant confirmation via text

2. TEXT MESSAGE:
   - Text the hotline number above
   - Format: "Calling out sick - [your reason]"
   - Receive instant confirmation via text

Your manager will be notified immediately via email.

For best results:
- Make sure we have your correct phone number on file
- If calling from a different number, know your PIN: [Contact HR]

Questions? Contact your manager.

Best regards,
HR Team
```

---

## Troubleshooting

### Issue: Calls aren't being received
- Check Twilio webhook URLs are correct
- Verify Flask app is running
- Check ngrok is still active (ngrok URLs expire)
- Look at Twilio Console → Monitor → Logs for errors

### Issue: Authentication fails
- Verify phone number format in database: `+15551234567`
- Phone numbers must include country code (+1 for US)
- Check employee has phone number OR PIN set

### Issue: Recordings not working
- Verify `ENABLE_CALL_RECORDING=True` in .env
- Check Twilio account has recording enabled
- Wait a few seconds for recording to process

### Issue: Emails not sending
- Check email configuration in .env
- Verify `EMAIL_ENABLED=True`
- Check SMTP credentials are correct

### Issue: Database errors
- Make sure migration ran successfully
- Check `pin` column exists in `users` table
- Check `call_out_records` table exists

---

## Security Best Practices

1. **Never commit .env to Git**
   ```bash
   # Add to .gitignore
   .env
   *.db
   ```

2. **Use strong, unique PINs**
   - Don't use sequential numbers (1234, 0000)
   - Rotate PINs periodically

3. **Restrict webhook access**
   - Validate requests come from Twilio
   - Use Twilio's signature validation (advanced)

4. **Secure call recordings**
   - Only managers can access recordings
   - Consider auto-deletion after 30 days
   - Comply with company recording policies

5. **Monitor usage**
   - Check Twilio Console for unusual activity
   - Set up usage alerts in Twilio
   - Review call-out patterns regularly

---

## Cost Estimation

**Twilio Pricing (as of 2024):**
- Phone number: $1.15/month
- Incoming voice calls: $0.0085/minute
- Incoming SMS: $0.0075/message
- Recording storage: $0.0005/minute/month
- Outgoing SMS confirmations: $0.0079/message

**Example monthly cost for 50 employees:**
- 20 call-outs per month
- Average 2-minute call
- 10 SMS call-outs per month

```
Phone number:        $1.15
Voice calls:         $0.34  (20 calls × 2 min × $0.0085)
SMS inbound:         $0.08  (10 messages × $0.0075)
SMS outbound:        $0.24  (30 confirmations × $0.0079)
Recording storage:   $0.02  (40 min × $0.0005)
─────────────────────────
Total:              ~$1.83/month
```

Very affordable! 🎉

---

## Support

If you need help:
1. Check Twilio Console → Monitor → Logs
2. Check Flask app console output
3. Review this guide
4. Contact Twilio Support: https://support.twilio.com

---

## Feature Roadmap (Future Enhancements)

Potential future improvements:
- [ ] Call transcription (Twilio Transcription API)
- [ ] Multi-language support (Spanish, etc.)
- [ ] Manager SMS alerts (already supported via config)
- [ ] Voice recognition for reason extraction
- [ ] Integration with calendar apps (Google Calendar, Outlook)
- [ ] Analytics dashboard (call-out trends, peak times)
- [ ] Automated coverage assignment
- [ ] Return-to-work confirmation

---

**Congratulations! Your Twilio call-out feature is now ready to use!** 🎉📞
