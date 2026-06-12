#!/usr/bin/env python3
"""
Update YouTube video descriptions for the AllOEMManuals channel.
Uses OAuth 2.0 authorization code from YOUTUBE_AUTH_CODE env var.
"""
import json
import os
import pickle
import sys
from urllib.parse import parse_qs, urlparse

from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

CLIENT_ID = os.environ.get("YOUTUBE_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("YOUTUBE_CLIENT_SECRET", "")
if not CLIENT_ID or not CLIENT_SECRET:
    raise SystemExit("Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET env vars.")
SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl"]
TOKEN_FILE = ".youtube-token.pickle"

UPDATES = {
    "cKOCprh34HI": {
        "title": "브레이크에 50만원? 이 AI 사이트에서 묣 수리",
        "description": """비싼 수리비에 지쳤나요? AllOEMManuals.com은 묣 AI 정비사입니다.

모든 차량에 대한 단계별 안내.
100% 묣.

https://alloemmanuals.com

#자동차수리 #DIY #alloemmanuals #AI""",
        "tags": ["자동차수리", "DIY", "alloemmanuals", "AI"],
    },
    "60HzZ81LT20": {
        "title": "450€ per i freni? Questo sito IA ripara GRATIS",
        "description": """Stufa di riparazioni costose? AllOEMManuals.com è il tuo meccanico IA gratuito.

Passo dopo passo per qualsiasi veicolo.
100% Gratis.

https://alloemmanuals.com

#riparazioneauto #meccanica #DIY #alloemmanuals #IA""",
        "tags": ["riparazioneauto", "meccanica", "DIY", "alloemmanuals", "IA"],
    },
    "wqRsJhs6d18": {
        "title": "€450 voor remmen? Deze AI-site repareert GRATIS",
        "description": """Genoeg van dure reparaties? AllOEMManuals.com is je gratis AI-monteur.

Stap voor stap voor elk voertuig.
100% Gratis.

https://alloemmanuals.com

#autoreparatie #monteur #DIY #alloemmanuals #AI""",
        "tags": ["autoreparatie", "monteur", "DIY", "alloemmanuals", "AI"],
    },
    "qRbnvoKbEMw": {
        "title": "450 zł za hamulce? Ta strona z AI naprawi ZA DARMO",
        "description": """Dość drogich napraw? AllOEMManuals.com to Twój darmowy mechanik AI.

Krok po kroku dla każdego pojazdu.
100% Za darmo.

https://alloemmanuals.com

#naprawaauta #mechanika #DIY #alloemmanuals #AI""",
        "tags": ["naprawaauta", "mechanika", "DIY", "alloemmanuals", "AI"],
    },
    "bL_hJXwFoI4": {
        "title": "¿$450 por frenos? Este sitio con IA lo arregla GRATIS",
        "description": """¿Cansada de reparaciones caras? AllOEMManuals.com es tu mecánico AI gratuito.

Instrucciones paso a paso para cualquier auto.
Diagnóstico de motor al instante.
100% Gratis — Sin registro.

https://alloemmanuals.com

#reparaciondeautos #mecánica #DIY #alloemmanuals #inteligenciaartificial""",
        "tags": ["reparaciondeautos", "mecánica", "DIY", "alloemmanuals", "inteligenciaartificial"],
    },
    "muq1jvgefLw": {
        "title": "R$450 por freios? Esse site com IA conserta GRÁTIS",
        "description": """Cansada de reparos caros? AllOEMManuals.com é seu mecânico IA gratuito.

Passo a passo para qualquer veículo.
100% Grátis.

https://alloemmanuals.com

#reparo #mecânica #DIY #alloemmanuals #IA""",
        "tags": ["reparo", "mecânica", "DIY", "alloemmanuals", "IA"],
    },
    "v48yJw-aAhU": {
        "title": "ブレーキに5万円？このAIサイトで無料修理",
        "description": """高い修理代にうんざり？AllOEMManuals.comは無料のAIメカニック。

どんな車種でもステップバイステップ。
完全無料。

https://alloemmanuals.com

#自動車修理 #DIY #alloemmanuals #AI""",
        "tags": ["自動車修理", "DIY", "alloemmanuals", "AI"],
    },
    "VPDf4CC6oA0": {
        "title": "450€ für Bremsen? Diese KI-Seite repariert KOSTENLOS",
        "description": """Genug von teuren Reparaturen? AllOEMManuals.com ist Ihr kostenloser KI-Mechaniker.

Schritt-für-Schritt für jedes Fahrzeug.
100% Kostenlos.

https://alloemmanuals.com

#autoreparatur #KFZ #DIY #alloemmanuals #KI""",
        "tags": ["autoreparatur", "KFZ", "DIY", "alloemmanuals", "KI"],
    },
    "e_3UcJ_KpWQ": {
        "title": "450€ pour des freins? Ce site IA répare GRATUIT",
        "description": """Marre des réparations coûteuses? AllOEMManuals.com est votre mécanicien IA gratuit.

Instructions étape par étape pour tout véhicule.
100% Gratuit — Sans inscription.

https://alloemmanuals.com

#réparationauto #mécanique #DIY #alloemmanuals #IA""",
        "tags": ["réparationauto", "mécanique", "DIY", "alloemmanuals", "IA"],
    },
}


def get_credentials():
    creds = None
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "rb") as token:
            creds = pickle.load(token)

    if creds and creds.valid:
        return creds

    if creds and creds.expired and creds.refresh_token:
        print("Refreshing access token...")
        creds.refresh(Request())
    else:
        auth_code = os.environ.get("YOUTUBE_AUTH_CODE", "").strip()
        if not auth_code:
            print("Error: YOUTUBE_AUTH_CODE environment variable is not set.")
            print("Run: .venv-youtube/bin/python scripts/get-youtube-auth-url.py")
            print("Then authorize and set YOUTUBE_AUTH_CODE to the code from the redirect URL.")
            sys.exit(1)

        code_verifier = None
        if os.path.exists(".youtube-oauth-state.json"):
            with open(".youtube-oauth-state.json") as f:
                state = json.load(f)
                code_verifier = state.get("code_verifier")

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
        flow.fetch_token(code=auth_code, code_verifier=code_verifier)
        creds = flow.credentials

    with open(TOKEN_FILE, "wb") as token:
        pickle.dump(creds, token)

    return creds


def main():
    creds = get_credentials()
    youtube = build("youtube", "v3", credentials=creds)

    for video_id, data in UPDATES.items():
        print(f"Updating {video_id}: {data['title']}")
        try:
            youtube.videos().update(
                part="snippet",
                body={
                    "id": video_id,
                    "snippet": {
                        "title": data["title"],
                        "description": data["description"],
                        "tags": data["tags"],
                        "categoryId": "22",  # People & Blogs
                    },
                },
            ).execute()
            print(f"  ✓ Updated {video_id}")
        except Exception as e:
            print(f"  ✗ Failed to update {video_id}: {e}")

    print("\nDone.")


if __name__ == "__main__":
    main()
