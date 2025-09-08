# Overview

This is a football club website for AFC Richman, built with React/TypeScript on the frontend and Express/Node.js on the backend. The application features player profiles, statistics tracking, match information, and a modern responsive design using shadcn/ui components. The system supports team management with detailed player data, performance statistics, and match results display.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Client-side routing with Wouter for lightweight navigation
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query for server state management and data fetching
- **Component Structure**: Organized into pages, components, and UI components with clear separation of concerns

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with endpoints for players, statistics, and matches
- **Data Layer**: In-memory storage implementation with interface for future database integration
- **Middleware**: Request logging, JSON parsing, and error handling
- **Development**: Hot module replacement with Vite integration for development mode

## Data Storage Strategy
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema**: Strongly typed database schema with players, playerStats, and matches tables
- **Current Implementation**: In-memory storage with seed data for development
- **Migration Support**: Drizzle-kit for database schema migrations
- **Data Models**: Shared TypeScript types between client and server

## Component Design System
- **Design Language**: shadcn/ui with "new-york" style variant
- **Color Scheme**: Dark theme with red accent colors (--primary: hsl(0 84% 55%))
- **Typography**: CSS custom properties for font families
- **Icons**: Lucide React for consistent iconography
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## API Structure
- **Players**: CRUD operations with filtering by position
- **Statistics**: Player performance data with seasonal filtering
- **Matches**: Match results and fixtures with competition categorization
- **Error Handling**: Consistent error responses with appropriate HTTP status codes

# External Dependencies

## Core Framework Dependencies
- **@vitejs/plugin-react**: React support for Vite build tool
- **express**: Web application framework for Node.js
- **wouter**: Lightweight client-side routing library

## UI and Styling
- **@radix-ui/react-***: Comprehensive set of unstyled UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for component styling
- **clsx**: Utility for constructing className strings

## Data Management
- **@tanstack/react-query**: Data fetching and caching library
- **drizzle-orm**: Type-safe ORM for SQL databases
- **@neondatabase/serverless**: Neon database driver for serverless environments
- **drizzle-kit**: CLI companion for Drizzle ORM migrations

## Development Tools
- **typescript**: Static type checking
- **vite**: Fast build tool and development server
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **tsx**: TypeScript execution engine for Node.js

## Form and Validation
- **react-hook-form**: Performant forms with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for react-hook-form
- **zod**: Schema validation library (via drizzle-zod)

## Additional Features
- **date-fns**: Date utility library for formatting
- **embla-carousel-react**: Carousel component for image galleries
- **cmdk**: Command menu component for search functionality