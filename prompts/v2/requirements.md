# Requirements for Global Partners Management
This is the CRUD management for Global Partners, by the platform admin.

Inspect the project and follow the structure, color scheme and the naming conventions.

## The Pages or screens
Use the openapi.yaml file to create the pages:
- Platform Partners CRUD
- Service Level Agreements CRUD
- Partner Agreements CRUD
- License Audit Verification Requests paginated list
- License Audit Verification Response paginated list

## The API
Use the openapi.yaml file to add the API endpoints for the pages or screens following the existing structure.

## Validation
- Validate the fields using the openapi.yaml file.
- Validate the entries using the openapi.yaml file.
- Partner filed in the Partner Agreements screen must be a valid partner.
- Partner filed in the Partner Agreements screen must be selected from an existing partner.
- SLA filed in the Partner Agreements screen must be a valid partner.
- SLA filed in the Partner Agreements screen must be selected from an existing Service Level Agreement.

## Generate Api Key for Partner by Platform Admin
- The screen should be accessible only by the platform admin.
- The platform admin selects a partner from the list and clicks on the Generate Api Key button.
- Add a screen that displays a Generate Api Key screen similar to the existing one in the project to generate the API key.

## Rules
- The platform admin can only access the screens and API endpoints that are listed in the openapi.yaml file.
- Follow clean code and naming conventions.
- Follow the existing structure and color scheme.
- Follow clean architecture.
