# Agent Module

This module serves as a proxy between the frontend application and the Python-based Agent microservice. 

## Purpose

The Agent Module acts as an intermediary layer, preventing direct access to the Python agent microservice from the frontend. All communication to the Python agent service happens through this module.

## Architecture

- `AgentController`: Handles HTTP requests from the frontend and forwards them to the Python agent service
- `AgentService`: Contains the logic for communicating with the Python agent microservice
- `dto/`: Contains Data Transfer Object definitions for the module

## Configuration

The module requires the `AGENT_SERVICE_URL` environment variable to be set to the URL of the Python agent microservice.

Example:
```
AGENT_SERVICE_URL=http://agent-service:5000
```

## API Endpoints

All endpoints of this module require authentication via the AuthGuard. The controller proxies requests to the agent service while preserving path parameters, query parameters, and request bodies.

- `GET /agent/:path*` - Proxies GET requests
- `POST /agent/:path*` - Proxies POST requests
- `PUT /agent/:path*` - Proxies PUT requests
- `DELETE /agent/:path*` - Proxies DELETE requests
