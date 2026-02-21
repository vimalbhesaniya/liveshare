# Exit-Intent Feedback Form – EmailJS Setup

## Overview

The feedback modal appears when users move their cursor toward the top of the screen (exit intent) to leave the site. It shows only once per device (tracked via `localStorage`).

## EmailJS Configuration

### 1. Create an EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/) and sign up.
2. Verify your email.

### 2. Add an Email Service

1. In the dashboard, go to **Email Services** → **Add New Service**.
2. Choose a provider (Gmail, Outlook, etc.) and connect it.
3. Copy the **Service ID** (e.g. `service_xxxxx`).

### 3. Create an Email Template

1. Go to **Email Templates** → **Create New Template**.
2. Use these template variables:
   - `{{from_name}}` – user’s name (or "Anonymous")
   - `{{from_email}}` – user’s email (or "not-provided@feedback.local")
   - `{{message}}` – feedback text

3. Example template:
   ```
   New feedback from LiveShare

   Name: {{from_name}}
   Email: {{from_email}}

   Message:
   {{message}}
   ```

4. Save and copy the **Template ID** (e.g. `template_xxxxx`).

### 4. Get Your Public Key

1. Go to **Account** → **General**.
2. Copy the **Public Key**.

### 5. Add Environment Variables

Add these to `.env`:

```
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

Restart the dev server after editing `.env`.

## Exit Intent Behavior

- **Desktop:** Triggered when the mouse leaves the top of the viewport (cursor moving toward the address bar / tab close).
- **Tab close / refresh:** Browsers do not allow custom modals during `beforeunload`. The modal is only shown via mouse exit intent.

## localStorage Key

Shown state is stored under `liveshare-exit-feedback-shown`. Clearing this key will make the modal appear again.
