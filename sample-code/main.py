from flask import Flask, render_template

@app.route("/")
def home():
    """Landing page — explains what TitleHub is and hooks the visitor."""
    return render_template("gold-template.html")
