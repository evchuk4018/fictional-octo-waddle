# iOS Widget Setup for Goal Tracker PWA

Follow these steps to get the dashboard insights widget running on your iPhone:

1. **Install the PWA**: Open the app in Safari, tap Share → Add to Home Screen, and launch it from there so Safari keeps the PWA shell and auth cookies live.
2. **Log in & grab the cookie**: Sign in via the installed PWA, then copy the Supabase session cookie that keeps you logged in (Scriptable will need it to authenticate requests to the widget API).
3. **Update the Scriptable script**: Create a new script in Scriptable and paste the contents of `public/widgets/ios-scriptable-widget.js`. Replace `https://YOUR_DOMAIN` with your deployed URL and `YOUR_AUTH_COOKIE` with the session cookie you copied.
4. **Authorize & add the widget**: Run the script once so Scriptable prompts for network access. Then add a Scriptable widget to your home screen and attach this script so it fetches data from `/api/widgets/summary` periodically.
5. **Maintain the session**: The cookie expires as your Supabase session does, so refresh it by rerunning the script after logging in again or consider building a lightweight backend proxy if you want to share the widget.
