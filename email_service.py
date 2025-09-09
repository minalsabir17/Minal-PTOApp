import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def get_domain_name():
    """Get the application domain name"""
    # For local development
    return "localhost:5000"

class EmailService:
    """Email service for sending notifications"""
    
    def __init__(self):
        self.smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        self.username = os.environ.get('EMAIL_USERNAME', 'noreply@mswcvi.com')
        self.password = os.environ.get('EMAIL_PASSWORD', 'default_password')
    
    def send_email(self, to_email, subject, body):
        """Send email via SMTP"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.username
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.username, self.password)
            text = msg.as_string()
            server.sendmail(self.username, to_email, text)
            server.quit()
            
            print(f"[SUCCESS] Email sent successfully to {to_email}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to send email to {to_email}: {e}")
            # Keep console mode as fallback for debugging
            print("="*50)
            print("EMAIL NOTIFICATION (Fallback Console Mode)")
            print("="*50)
            print(f"TO: {to_email}")
            print(f"SUBJECT: {subject}")
            print(f"BODY:\n{body}")
            print("="*50)
            return False

def send_submission_email(request_data, request_id):
    """Send email notifications for PTO request submission"""
    email_service = EmailService()
    
    # Check for custom subject and body (for employee registrations)
    if request_data.get('subject_override') and request_data.get('body_override'):
        employee_subject = request_data.get('subject_override')
        employee_body = request_data.get('body_override')
    else:
        # Regular PTO request email
        employee_subject = f"PTO Request Submitted - Request #{request_id}"
        employee_body = f"""
Dear {request_data.get('name', 'Employee')},

Your PTO request has been successfully submitted.

Request Details:
- Request ID: #{request_id}
- Date Range: {request_data.get('start_date')} to {request_data.get('end_date')}
- Type: {request_data.get('pto_type', 'PTO')}
- Status: Pending Approval

You will receive another email once your request has been reviewed.

Best regards,
MSW CVI PTO System
"""
    
    employee_email = request_data.get('email')
    if employee_email:
        email_service.send_email(employee_email, employee_subject, employee_body)
    
    # Email to manager (simplified for local testing)
    manager_subject = f"New PTO Request - {request_data.get('name')} - Request #{request_id}"
    manager_body = f"""
A new PTO request has been submitted and requires your review.

Employee: {request_data.get('name')}
Email: {request_data.get('email')}
Position: {request_data.get('position')}
Team: {request_data.get('team')}

Request Details:
- Request ID: #{request_id}
- Date Range: {request_data.get('start_date')} to {request_data.get('end_date')}
- Type: {request_data.get('pto_type', 'PTO')}
- Duration: {request_data.get('duration_days', 'N/A')} day(s)

Please log in to the PTO system to review and approve/deny this request:
http://{get_domain_name()}/login

Best regards,
MSW CVI PTO System
"""
    
    # For local testing, just print the manager notification
    print("[INFO] Manager notification would be sent:")
    print(f"Subject: {manager_subject}")
    print(f"Body: {manager_body}")
    
    return True