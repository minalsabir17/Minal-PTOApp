# MSW CVI PTO Tracker

A comprehensive Flask-based PTO (Paid Time Off) tracking system for Mount Sinai West Cardiovascular Institute.

## Features

- **Multi-role Management**: Admin, Clinical, Super Admin, MOA Supervisor, Echo Tech Supervisor
- **PTO Request Submission**: Full and partial day requests with automatic balance calculation
- **Approval Workflow**: Role-based approval system with email notifications
- **Calendar View**: Visual representation of approved time off
- **Staff Directory Integration**: Pre-configured staff members by position and team
- **Real-time Balance Tracking**: Automatic PTO balance deduction upon approval

## Quick Start

### Prerequisites
- Python 3.11 or higher
- Flask and required dependencies (see requirements.txt)

### Installation

1. **Clone/Download the project** to your local machine
2. **Navigate to the project directory**:
   ```bash
   cd PtoTrackerLocal
   ```

3. **Install dependencies** (if virtual environment is not set up):
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

**Option 1: Using Python directly**
```bash
python app.py
```

**Option 2: Using the batch file (Windows)**
```bash
start_server.bat
```

The application will be available at: `http://127.0.0.1:5000`

## Default Manager Accounts

For testing and initial setup, use these default credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin Manager | admin.manager@mswcvi.com | admin123 |
| Clinical Manager | clinical.manager@mswcvi.com | clinical123 |
| Super Admin | superadmin@mswcvi.com | super123 |
| MOA Supervisor | moa.supervisor@mswcvi.com | moa123 |
| Echo Tech Supervisor | echo.supervisor@mswcvi.com | echo123 |

## Usage

### For Employees
1. Visit the main page
2. Select your team, position, and name from the dropdowns
3. Choose your PTO dates and type
4. Submit the request
5. Receive email confirmation

### For Managers
1. Login using manager credentials
2. Access your role-specific dashboard
3. Review pending requests
4. Approve or deny requests with reasons
5. Track team PTO usage

### Key Pages
- **Home** (`/`): Submit new PTO requests
- **Calendar** (`/calendar`): View approved time off
- **Login** (`/login`): Manager authentication
- **Dashboards**: Role-specific management interfaces

## System Architecture

### Database Models
- **User**: Base user class with PTO balance tracking
- **TeamMember**: Employees who submit requests
- **Manager**: Supervisors who approve requests
- **PTORequest**: Individual PTO request records

### Key Features
- **7.5-hour workday standard** (configurable)
- **Automatic PTO deduction** upon approval
- **Partial day support** with hourly calculations
- **Email notifications** for all status changes
- **Role-based access control** for different manager types

## File Structure
```
PtoTrackerLocal/
├── app.py                 # Main Flask application
├── database.py           # Database configuration
├── models.py             # SQLAlchemy models
├── routes.py             # Flask routes and views
├── auth.py               # Authentication system
├── email_service.py      # Email notification service
├── pto_system.py         # Core PTO business logic
├── static/
│   ├── css/custom.css    # Mount Sinai themed styles
│   └── js/main.js        # Frontend JavaScript
├── templates/            # Jinja2 HTML templates
└── requirements.txt      # Python dependencies
```

## Customization

### Adding New Staff Members
Edit the `get_staff_directory()` function in `routes.py` to add new team members.

### Modifying PTO Policies
Update the business logic in `pto_system.py` and `models.py` for different PTO rules.

### Styling Changes
Modify `static/css/custom.css` to customize the Mount Sinai theme colors and layout.

## Technical Notes

- **Database**: SQLite for local development (easily configurable for PostgreSQL)
- **Authentication**: Session-based with password hashing
- **Email**: SMTP configuration with fallback to console logging
- **Security**: Role-based access control and CSRF protection

## Production Deployment

For production use:
1. Change default passwords immediately
2. Configure proper email SMTP settings
3. Use a production database (PostgreSQL recommended)
4. Set up proper SSL/HTTPS
5. Use a production WSGI server (Gunicorn, uWSGI)

## Frontend Testing

The application includes comprehensive frontend tests using Playwright MCP:

### Quick Testing
```bash
# Run all basic tests
npx playwright test tests/basic.spec.js --project=chromium

# Run with visual browser
npx playwright test --headed

# View test reports
npx playwright show-report
```

### Test Coverage
- ✅ UI component rendering and interaction
- ✅ Manager authentication and role-based access
- ✅ PTO request submission and validation
- ✅ Approval/denial workflows
- ✅ Calendar integration
- ✅ Multi-browser compatibility (Chrome, Firefox, Safari)
- ✅ Mobile responsiveness

See `TESTING.md` for detailed testing documentation.

## Support

For issues or questions about the PTO Tracker system, contact your IT administrator.