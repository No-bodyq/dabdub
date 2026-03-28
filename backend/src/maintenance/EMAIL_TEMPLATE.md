# Maintenance Notification Email Template

## Template Alias: `maintenance-notification`

This template should be created in your email service provider (ZeptoMail) with the following merge variables:

### Merge Variables

- `firstName` - User's first name
- `title` - Maintenance window title
- `description` - Maintenance window description  
- `startTime` - ISO timestamp when maintenance starts
- `endTime` - ISO timestamp when maintenance ends
- `timeframe` - Human readable timeframe ("24 hours" or "1 hour")

### Example Template Content

```html
<!DOCTYPE html>
<html>
<head>
    <title>Scheduled Maintenance Notification</title>
</head>
<body>
    <h1>Scheduled Maintenance in {{timeframe}}</h1>
    
    <p>Hi {{firstName}},</p>
    
    <p>We wanted to let you know about upcoming scheduled maintenance:</p>
    
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2>{{title}}</h2>
        <p>{{description}}</p>
        
        <p><strong>Start:</strong> {{startTime}}</p>
        <p><strong>End:</strong> {{endTime}}</p>
    </div>
    
    <p>During this time, some services may be temporarily unavailable. We apologize for any inconvenience and appreciate your patience.</p>
    
    <p>Thank you,<br>The Cheese Team</p>
</body>
</html>
```

### Usage

The template is automatically used by the maintenance system when sending advance notifications (24h and 1h before maintenance windows).