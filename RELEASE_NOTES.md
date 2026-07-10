# Release Notes

## v1.0.3.2 - 2026-07-10

Tag: v1.0.3.2
Branch: development

### Highlights
- Added contact child-entity support in save payloads so address and phone changes are included with contact updates.
- Completed communication-edit workflow improvements for contact child data.
- Updated deployment artifact and release metadata for this build.

### UI and UX
- Continued responsive Contacts page refinements across desktop, iPad, and mobile layouts.
- Kept action controls visible with sticky/footer action behavior in constrained viewports.
- Aligned New Contact action styling with the communication-tab add-action look and applied a subtle blue-gray face tint.

### Fixes
- Resolved dialog binding issue where editing an address could populate text fields with boolean values.
- Ensured environment version files remain tracked for reliable release/version updates.

### Deployment
- Deployed UI package to Azure App Service: https://mdmanagementstudio-ng-gui.azurewebsites.net
