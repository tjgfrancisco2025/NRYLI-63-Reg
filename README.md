# NRYLI-63-Reg
# 63rd NRYLI Registration System

A modern, responsive web-based registration system for the 63rd National Rizal Youth Leadership Institute, built with HTML, JavaScript, Supabase, and deployed on Vercel.

## Features

- **Multi-step Form**: Clean, user-friendly registration process
- **Real-time Validation**: Client-side validation with helpful error messages
- **File Upload**: Secure payment proof upload with size validation
- **Database Integration**: Supabase PostgreSQL database with file storage
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Progress Tracking**: Visual progress indicator throughout the form
- **Email Integration**: Automated confirmation emails (coming soon)

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Deployment**: Vercel

## Setup Instructions

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd nryli-registration
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL script from `supabase-schema.sql` to create tables and policies
4. Go to Settings > API to get your project URL and API keys

### 3. Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### 4. Local Development

```bash
npm run dev
# or
vercel dev
```

Visit `http://localhost:3000` to view the application.

### 5. Deploy to Vercel

#### Option A: Vercel CLI
```bash
npm install -g vercel
vercel
```

#### Option B: GitHub Integration
1. Push your code to GitHub
2. Import your repository at [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### 6. Configure Environment Variables in Vercel

In your Vercel dashboard:
1. Go to Settings > Environment Variables
2. Add the following variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Database Schema

The system uses a single `registrations` table with the following structure:

```sql
registrations (
    id SERIAL PRIMARY KEY,
    registration_id VARCHAR(20) UNIQUE,
    delegate_type VARCHAR(50),
    surname VARCHAR(100),
    first_name VARCHAR(100),
    middle_initial VARCHAR(1),
    institution VARCHAR(255),
    institution_address TEXT,
    institution_contact VARCHAR(20),
    institution_email VARCHAR(255),
    region_cluster VARCHAR(20),
    delegate_contact VARCHAR(20),
    delegate_email VARCHAR(255),
    age INTEGER,
    tshirt_size VARCHAR(10),
    dietary_preferences VARCHAR(50),
    dietary_comments TEXT,
    payment_option VARCHAR(50),
    payment_proof_url TEXT,
    transaction_ref VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
```

## File Structure

```
├── api/
│   └── submit-registration.js    # Vercel serverless function
├── index.html                    # Main registration form
├── package.json                  # Dependencies
├── vercel.json                   # Vercel configuration
├── supabase-schema.sql          # Database schema
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

## API Endpoints

### POST /api/submit-registration

Submits a new registration with form data and file upload.

**Request**: FormData with all form fields + payment proof file
**Response**: 
```json
{
  "success": true,
  "registrationId": "NRYLI2025-12345678",
  "message": "Registration submitted successfully"
}
```

## Features Breakdown

### Form Validation
- Client-side validation for required fields
- Email format validation
- File size validation (max 5MB)
- Age range validation (15-35 years)

### File Upload
- Accepts JPG, PNG, PDF formats
- Automatic file size validation
- Secure upload to Supabase Storage
- Public URL generation for storage

### Security
- Row Level Security (RLS) enabled
- Public insert policy for registrations
- File upload size limits
- Input sanitization

### Responsive Design
- Mobile-first approach
- Grid layouts that adapt to screen size
- Touch-friendly interface
- Print-friendly confirmation page

## Customization

### Styling
Modify the CSS variables in `index.html` to change colors and styling:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #4CAF50;
}
```

### Form Fields
To add/modify form fields:
1. Update the HTML form structure
2. Modify the database schema in `supabase-schema.sql`
3. Update the API endpoint in `api/submit-registration.js`
4. Update validation logic in the frontend JavaScript

### Email Integration
To add email confirmations:
1. Set up email service (Resend, SendGrid, etc.)
2. Add email sending logic to the API endpoint
3. Create email templates

## Troubleshooting

### Common Issues

1. **File upload fails**: Check file size (max 5MB) and format (JPG, PNG, PDF)
2. **Database connection error**: Verify Supabase URL and keys in environment variables
3. **CORS errors**: Ensure Supabase RLS policies are configured correctly
4. **Deployment issues**: Check that all environment variables are set in Vercel

### Logs and Debugging

- View Vercel function logs in the Vercel dashboard
- Check browser console for client-side errors
- Monitor Supabase logs in the Supabase dashboard

## Support

For technical issues or questions:
1. Check the browser console for error messages
2. Review Vercel function logs
3. Verify Supabase configuration and policies
4. Ensure all environment variables are properly set

## License

This project is licensed under the MIT License.
