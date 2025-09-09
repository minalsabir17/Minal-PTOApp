import os
import logging
from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix
from database import db

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key_for_development")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///pto_tracker.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize the app with the extension
db.init_app(app)

with app.app_context():
    # Import models and routes
    from models import User, TeamMember, PTORequest, Manager
    from routes import *
    
    # Create all tables
    db.create_all()
    
    # Initialize default managers if they don't exist
    from werkzeug.security import generate_password_hash
    
    managers_to_create = [
        {
            'name': 'Admin Manager',
            'email': 'admin.manager@mswcvi.com',
            'role': 'admin',
            'password': 'admin123'
        },
        {
            'name': 'Clinical Manager',
            'email': 'clinical.manager@mswcvi.com', 
            'role': 'clinical',
            'password': 'clinical123'
        },
        {
            'name': 'Super Admin',
            'email': 'superadmin@mswcvi.com',
            'role': 'superadmin', 
            'password': 'super123'
        },
        {
            'name': 'MOA Supervisor',
            'email': 'moa.supervisor@mswcvi.com',
            'role': 'moa_supervisor',
            'password': 'moa123'
        },
        {
            'name': 'Echo Tech Supervisor', 
            'email': 'echo.supervisor@mswcvi.com',
            'role': 'echo_supervisor',
            'password': 'echo123'
        }
    ]
    
    for manager_data in managers_to_create:
        existing_manager = Manager.query.filter_by(email=manager_data['email']).first()
        if not existing_manager:
            new_manager = Manager(
                name=manager_data['name'],
                email=manager_data['email'],
                role=manager_data['role'],
                password_hash=generate_password_hash(manager_data['password'])
            )
            db.session.add(new_manager)
    
    db.session.commit()

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)