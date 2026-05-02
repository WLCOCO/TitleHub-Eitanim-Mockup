"""
TitleHub — Flask application entry point.
Defines all routes and handles basic session-based authentication
so users can sign up, log in, and browse the mock platform.
"""

from flask import Flask, render_template, redirect, url_for, session, flash
import os

app = Flask(__name__, template_folder='../templates', static_folder='../static')
# Secret key is required for session cookies and flash messages
app.secret_key = os.urandom(24)
# Disable static file caching in development so CSS/JS changes show immediately
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# In-memory user store — good enough for a mockup, no database needed yet
# Admin account pre-seeded for testing (remove before any real deployment)
# users = {
#     "admin": {"name": "Admin", "password": "test123"}
# }

# ──────────────────────────────────────────────
# Public pages
# ──────────────────────────────────────────────

@app.route("/")
def home():
    """Landing page — explains what TitleHub is and hooks the visitor."""
    return render_template("index.html")


@app.route("/index.html")
def home_html():
    """Compatibility route so static-style links work in Flask dev mode."""
    return redirect(url_for("home"))


@app.route("/pricing")
def pricing():
    """Shows the subscription tiers so users can compare plans."""
    return render_template("pricing.html")


@app.route("/pricing.html")
def pricing_html():
    """Compatibility route so static-style links work in Flask dev mode."""
    return redirect(url_for("pricing"))


# ──────────────────────────────────────────────
# Authentication
# ──────────────────────────────────────────────

@app.route("/login")
def login():
    """Login page — directs visitors to the onboarding modal flow."""
    return render_template("login.html")


@app.route("/login.html")
def login_html():
    """Compatibility route so static-style links work in Flask dev mode."""
    return redirect(url_for("login"))


@app.route("/signup")
def signup():
    """Signup page — directs visitors to the onboarding modal flow."""
    return render_template("signup.html")


@app.route("/signup.html")
def signup_html():
    """Compatibility route so static-style links work in Flask dev mode."""
    return redirect(url_for("signup"))


@app.route("/guest")
def guest():
    """Bypasses login for beta testing / demos — sets a guest session."""
    session["user"] = "guest"
    session["name"] = "Guest"
    return redirect(url_for("browse"))


@app.route("/logout")
def logout():
    """Clears the session and sends the user back to the landing page."""
    session.clear()
    flash("You've been logged out.", "success")
    return redirect(url_for("home"))


# ──────────────────────────────────────────────
# Authenticated pages
# ──────────────────────────────────────────────

@app.route("/browse")
def browse():
    """
    The main dashboard — shows content filtered to the user's selected platforms.
    Platform selection is handled client-side via sessionStorage.
    """
    return render_template("browse.html")


@app.route("/browse.html")
def browse_html():
    """Compatibility route so static-style links work in Flask dev mode."""
    return redirect(url_for("browse"))


# ──────────────────────────────────────────────
# Run the dev server
# ──────────────────────────────────────────────

if __name__ == "__main__":
    # debug=True gives auto-reload and helpful error pages during development
    app.run(debug=True)