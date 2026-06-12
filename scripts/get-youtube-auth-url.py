#!/usr/bin/env python3
"""Generate YouTube OAuth authorization URL and save PKCE verifier."""
import json
import os
from google_auth_oauthlib.flow import Flow

CLIENT_ID = os.environ.get("YOUTUBE_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("YOUTUBE_CLIENT_SECRET", "")
if not CLIENT_ID or not CLIENT_SECRET:
    raise SystemExit("Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET env vars.")

SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl"]

client_config = {
    "installed": {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost"],
    }
}
flow = Flow.from_client_config(client_config, SCOPES)
flow.redirect_uri = "http://localhost"
auth_url, _ = flow.authorization_url(
    access_type="offline",
    include_granted_scopes="true",
    prompt="consent",
)

# Save PKCE verifier so update script can finish the flow
with open(".youtube-oauth-state.json", "w") as f:
    json.dump({"code_verifier": flow.code_verifier}, f)

print(auth_url)
