# P2PAIv5 10/17/25

A comprehensive healthcare management system built with React, TypeScript, Vite, and Supabase.

## Features

- Patient charting and clinical notes
- Appointment scheduling and management
- HIPAA-compliant audit logging
- Functional medicine support
- Aesthetics module
- Lab ordering and trends tracking
- Secure patient portal
- Gift cards and memberships

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Build Tool**: Vite
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Database Setup

The project includes comprehensive database migrations in the `supabase/migrations` folder. These migrations set up:
- User management and authentication
- Patient records and charting
- Clinical assessments and notes
- Appointment scheduling
- HIPAA compliance infrastructure
- And much more

## License

Private - All Rights Reserved
