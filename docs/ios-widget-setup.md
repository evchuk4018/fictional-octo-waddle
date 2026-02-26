# iOS Widget Setup for Goal Tracker PWA

Follow these steps to get the dashboard insights widget running on your iPhone:

1. **Install the PWA**: Open the app in Safari, tap Share → Add to Home Screen, and launch it from there so Safari keeps the PWA shell and auth cookies live.
2. **Log in & copy current script**: Sign in from the dashboard, then tap **Copy current script** at the top of Home. This copies a Scriptable script that already contains your current auth cookie.
3. **Create the Scriptable script**: In Scriptable, create a new script and paste what you copied. The endpoint is already set to `https://theapp-blue.vercel.app/api/widgets/summary`.
4. **Authorize & add the widget**: Run the script once so Scriptable prompts for network access. Then add a Scriptable widget to your home screen and attach this script so it fetches data from `/api/widgets/summary` periodically.
5. **Maintain the session**: If the widget stops authenticating, log in again and tap **Copy current script** to get a fresh cookie in the script.
