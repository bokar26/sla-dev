from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 
    'sqlite:///waitlist.db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
CORS(app)

# Database Models
class WaitlistEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    company = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='pending')
    source = db.Column(db.String(50), default='website')
    
    def __repr__(self):
        return f'<WaitlistEntry {self.email}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'company': self.company,
            'message': self.message,
            'created_at': self.created_at.isoformat(),
            'status': self.status,
            'source': self.source
        }

# Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'smpl-logistics-waitlist-api'
    })

@app.route('/api/waitlist', methods=['POST'])
def join_waitlist():
    """Add a new person to the waitlist"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'company']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Check if email already exists
        existing_entry = WaitlistEntry.query.filter_by(email=data['email']).first()
        if existing_entry:
            return jsonify({
                'error': 'Email already registered on waitlist'
            }), 409
        
        # Create new waitlist entry
        new_entry = WaitlistEntry(
            name=data['name'].strip(),
            email=data['email'].strip().lower(),
            company=data['company'],
            message=data.get('message', '').strip(),
            source=data.get('source', 'website')
        )
        
        db.session.add(new_entry)
        db.session.commit()
        
        # Return success response
        return jsonify({
            'message': 'Successfully joined waitlist',
            'entry': new_entry.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error adding to waitlist: {e}")
        return jsonify({
            'error': 'Internal server error'
        }), 500

@app.route('/api/waitlist', methods=['GET'])
def get_waitlist():
    """Get waitlist entries (admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        entries = WaitlistEntry.query.order_by(
            WaitlistEntry.created_at.desc()
        ).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'entries': [entry.to_dict() for entry in entries.items],
            'pagination': {
                'page': entries.page,
                'pages': entries.pages,
                'per_page': entries.per_page,
                'total': entries.total,
                'has_next': entries.has_next,
                'has_prev': entries.has_prev
            }
        })
        
    except Exception as e:
        app.logger.error(f"Error fetching waitlist: {e}")
        return jsonify({
            'error': 'Internal server error'
        }), 500

@app.route('/api/waitlist/<int:entry_id>', methods=['GET'])
def get_waitlist_entry(entry_id):
    """Get a specific waitlist entry"""
    try:
        entry = WaitlistEntry.query.get_or_404(entry_id)
        return jsonify(entry.to_dict())
    except Exception as e:
        app.logger.error(f"Error fetching waitlist entry: {e}")
        return jsonify({
            'error': 'Internal server error'
        }), 500

@app.route('/api/waitlist/<int:entry_id>', methods=['PUT'])
def update_waitlist_entry(entry_id):
    """Update a waitlist entry (admin only)"""
    try:
        entry = WaitlistEntry.query.get_or_404(entry_id)
        data = request.get_json()
        
        # Update allowed fields
        if 'status' in data:
            entry.status = data['status']
        if 'message' in data:
            entry.message = data['message']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Entry updated successfully',
            'entry': entry.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating waitlist entry: {e}")
        return jsonify({
            'error': 'Internal server error'
        }), 500

@app.route('/api/waitlist/stats', methods=['GET'])
def get_waitlist_stats():
    """Get waitlist statistics"""
    try:
        total_entries = WaitlistEntry.query.count()
        pending_entries = WaitlistEntry.query.filter_by(status='pending').count()
        approved_entries = WaitlistEntry.query.filter_by(status='approved').count()
        
        # Company size distribution
        company_stats = db.session.query(
            WaitlistEntry.company,
            db.func.count(WaitlistEntry.id)
        ).group_by(WaitlistEntry.company).all()
        
        return jsonify({
            'total_entries': total_entries,
            'pending_entries': pending_entries,
            'approved_entries': approved_entries,
            'company_distribution': dict(company_stats)
        })
        
    except Exception as e:
        app.logger.error(f"Error fetching waitlist stats: {e}")
        return jsonify({
            'error': 'Internal server error'
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

# CLI commands
@app.cli.command("init-db")
def init_db():
    """Initialize the database."""
    db.create_all()
    print('Initialized the database.')

@app.cli.command("seed-db")
def seed_db():
    """Seed the database with sample data."""
    sample_entries = [
        WaitlistEntry(
            name="John Doe",
            email="john@example.com",
            company="1-10",
            message="Looking forward to trying the platform!"
        ),
        WaitlistEntry(
            name="Jane Smith",
            email="jane@example.com",
            company="11-50",
            message="Need better logistics management tools"
        )
    ]
    
    for entry in sample_entries:
        db.session.add(entry)
    
    db.session.commit()
    print('Database seeded with sample data.')

if __name__ == '__main__':
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Run the app
    app.run(
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 5001)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )
