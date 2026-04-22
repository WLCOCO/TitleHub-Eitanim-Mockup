@app.route("/")
def home():
    """Landing page — explains what TitleHub is and hooks the visitor."""
    return render_template("index.html")