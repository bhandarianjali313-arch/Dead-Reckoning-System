import os

base_dir = r"C:\Users\Lenovo\.gemini\antigravity\scratch\ai_dead_reckoning_system"
html_path = os.path.join(base_dir, "backend", "web", "index.html")
css_path = os.path.join(base_dir, "backend", "web", "styles.css")
js_path = os.path.join(base_dir, "backend", "web", "app.js")
leaflet_css_path = os.path.join(base_dir, "backend", "web", "leaflet", "leaflet.css")
leaflet_js_path = os.path.join(base_dir, "backend", "web", "leaflet", "leaflet.js")

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()
with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()
with open(leaflet_css_path, "r", encoding="utf-8") as f:
    leaflet_css = f.read()
with open(leaflet_js_path, "r", encoding="utf-8") as f:
    leaflet_js = f.read()

bundle = html.replace('<link rel="stylesheet" href="./leaflet/leaflet.css">', f"<style>\n/* LEAFLET CSS */\n{leaflet_css}\n</style>")
bundle = bundle.replace('<link rel="stylesheet" href="./styles.css">', f"<style>\n/* APP CSS */\n{css}\n</style>")
bundle = bundle.replace('<script src="./leaflet/leaflet.js"></script>', f"<script>\n/* LEAFLET JS */\n{leaflet_js}\n</script>")
bundle = bundle.replace('<script src="./app.js"></script>', f"<script>\n/* APP JS */\n{js}\n</script>")

artifact_path = r"C:\Users\Lenovo\.gemini\antigravity\brain\9a32afde-cab6-412c-a655-3a12fcfaf463\interactive_cockpit.html"
with open(artifact_path, "w", encoding="utf-8") as f:
    f.write(bundle)

print(f"Generated 100% self-contained bundle at {artifact_path} ({len(bundle)} bytes)")
