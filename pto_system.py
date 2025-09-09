from models import PTORequest, TeamMember, Manager
from database import db
from email_service import EmailService

class PTOTrackerSystem:
    """Main system class for managing PTO requests"""
    
    def __init__(self):
        self.email_service = EmailService()
    
    def add_request(self, member_data, pto_data):
        """Add a new PTO request"""
        # Create or get team member
        member = TeamMember.query.filter_by(email=member_data['email']).first()
        if not member:
            member = TeamMember(
                name=member_data['name'],
                email=member_data['email'],
                team=member_data['team'],
                position=member_data['position']
            )
            db.session.add(member)
            db.session.flush()  # Get the ID
        
        # Create PTO request
        request = PTORequest(
            member_id=member.id,
            start_date=pto_data['start_date'],
            end_date=pto_data['end_date'],
            pto_type=pto_data['pto_type'],
            manager_team=member.manager_team,
            is_partial_day=pto_data.get('is_partial_day', False),
            start_time=pto_data.get('start_time'),
            end_time=pto_data.get('end_time'),
            reason=pto_data.get('reason')
        )
        
        db.session.add(request)
        db.session.commit()
        
        return request
    
    def get_requests_by_team(self, team):
        """Get all requests for a specific manager team"""
        return PTORequest.query.filter_by(manager_team=team).all()
    
    def get_all_requests(self):
        """Get all requests (for superadmin)"""
        return PTORequest.query.all()
    
    def approve_request(self, request_id, manager):
        """Approve a PTO request"""
        request = PTORequest.query.get(request_id)
        if request and request.status == 'pending':
            request.status = 'approved'
            
            # Deduct PTO balance from member
            if request.member:
                hours_to_deduct = request.duration_hours
                current_balance = float(request.member.pto_balance_hours)
                new_balance = max(0, current_balance - hours_to_deduct)
                request.member.pto_balance_hours = new_balance
            
            db.session.commit()
            return True
        return False
    
    def deny_request(self, request_id, denial_reason, manager):
        """Deny a PTO request"""
        request = PTORequest.query.get(request_id)
        if request and request.status == 'pending':
            request.status = 'denied'
            request.denial_reason = denial_reason
            db.session.commit()
            return True
        return False