import os

base_dir = r"C:\Users\Lenovo\.gemini\antigravity\scratch\ai_dead_reckoning_system"
html_path = os.path.join(base_dir, "backend", "web", "index.html")
css_path = os.path.join(base_dir, "backend", "web", "styles.css")
js_path = os.path.join(base_dir, "backend", "web", "app.js")

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()
with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

bundle = html.replace('<link rel="stylesheet" href="./styles.css">', f"<style>\n{css}\n</style>")
bundle = bundle.replace('<script src="./app.js"></script>', f"<script>\n{js}\n</script>")

artifact_path = r"C:\Users\Lenovo\.gemini\antigravity\brain\9a32afde-cab6-412c-a655-3a12fcfaf463\interactive_cockpit.html"
with open(artifact_path, "w", encoding="utf-8") as f:
    f.write(bundle)

print(f"Generated bundle at {artifact_path} ({len(bundle)} bytes)")
