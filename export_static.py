from pathlib import Path

from app import app
from flask import session


ROOT = Path(__file__).parent

PAGES = {
    "index.html": {"route": "/", "session_user": False},
    "pricing.html": {"route": "/pricing", "session_user": False},
    "login.html": {"route": "/login", "session_user": False},
    "signup.html": {"route": "/signup", "session_user": False},
    "browse.html": {"route": "/browse", "session_user": True},
}

REPLACEMENTS = {
    'href="/"': 'href="index.html"',
    "href='/" : "href='",
    'href="/pricing"': 'href="pricing.html"',
    'href="/login"': 'href="login.html"',
    'href="/signup"': 'href="signup.html"',
    'href="/browse"': 'href="browse.html"',
    'href="/logout"': 'href="index.html"',
    'href="/?onboard=1"': 'href="index.html?onboard=1"',
    'href="/login?onboard=1"': 'href="login.html?onboard=1"',
    'window.location.replace("/")': 'window.location.replace("index.html")',
    "window.location.replace('/')": "window.location.replace('index.html')",
    'src="/static/': 'src="static/',
    'href="/static/': 'href="static/',
}


def normalize_html(html: str) -> str:
    normalized = html
    for old, new in REPLACEMENTS.items():
        normalized = normalized.replace(old, new)
    return normalized


def render_page(route: str, session_user: bool) -> str:
    with app.test_request_context(route):
        session.clear()
        if session_user:
            session["user"] = "guest"
            session["name"] = "Guest"
        view = app.view_functions[app.url_map.bind("localhost").match(route)[0]]
        return normalize_html(view())


def main() -> None:
    for file_name, config in PAGES.items():
        output = render_page(config["route"], config["session_user"])
        (ROOT / file_name).write_text(output, encoding="utf-8")

    (ROOT / "404.html").write_text((ROOT / "index.html").read_text(encoding="utf-8"), encoding="utf-8")
    (ROOT / ".nojekyll").write_text("", encoding="utf-8")


if __name__ == "__main__":
    main()