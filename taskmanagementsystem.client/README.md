# Task management system

This is a demo project written using React 18 (TypeScript) for frontend and ASP .NET 8 (C#) for backend.  

## Main features
- Create or join workspaces and create tasks inside
- Claim tasks for yourself or assign tasks to other members
- Edit, complete and archive tasks with edit history
- Manage roles and permissions for participants
- Create groups to manage  roles for multiple workspaces 
- Invite others with sharable invite links

## Technical features
- Single-page React app with browser router, no need to generate pages by server
- Data caching implemented using React custom hooks, minimizing HTTP requests
- Custom reusable function components, no external packages required
- Custom toast message component for better UX
- RESTful backend API using JWT as authentication scheme
- Server side data validation with appopriate response status code
- All non-public API endpoint secured with JWT and permission checks

## Dependencies
- react 18.3.1
- react-router-dom 6.24.0
- Microsoft.AspNetCore.Authentication.JwtBearer 8.0.6