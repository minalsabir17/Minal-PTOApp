from flask import session, request, redirect, url_for, flash
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
from models import Manager

def login_required(allowed_roles=None):
    """Decorator to require login and optionally restrict by role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                flash('Please log in to access this page', 'error')
                return redirect(url_for('login', next=request.url))
            
            if allowed_roles:
                user_role = session.get('user_role')
                if user_role not in allowed_roles:
                    flash('You do not have permission to access this page', 'error')
                    return redirect(url_for('not_authorized'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_current_user():
    """Get the current logged-in user"""
    if 'user_id' in session:
        return Manager.query.get(session['user_id'])
    return None

def is_logged_in():
    """Check if user is logged in"""
    return 'user_id' in session

def login_user(user):
    """Log in a user by setting session variables"""
    session['user_id'] = user.id
    session['user_name'] = user.name
    session['user_email'] = user.email
    session['user_role'] = user.role
    session.permanent = True

def logout_user():
    """Log out the current user"""
    session.clear()

def authenticate_user(email, password):
    """Authenticate a user with email and password"""
    user = Manager.query.filter_by(email=email).first()
    if user and user.password_hash and check_password_hash(user.password_hash, password):
        return user
    return None

def create_default_passwords():
    """Create default passwords for existing managers (for development)"""
    from database import db
    
    # Default passwords for development - in production these should be set properly
    default_passwords = {
        'admin.manager@mswcvi.com': 'admin123',
        'clinical.manager@mswcvi.com': 'clinical123',
        'superadmin@mswcvi.com': 'super123',
        'moa.supervisor@mswcvi.com': 'moa123',
        'echo.supervisor@mswcvi.com': 'echo123'
    }
    
    for email, password in default_passwords.items():
        manager = Manager.query.filter_by(email=email).first()
        if manager and not manager.password_hash:
            manager.password_hash = generate_password_hash(password)
    
    db.session.commit()