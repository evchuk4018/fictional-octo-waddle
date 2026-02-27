const endpoint = "https://theapp-blue.vercel.app/api/widgets/summary";

async function fetchSummary() {
  const req = new Request(endpoint);
  req.method = "GET";
  req.headers = {
    Cookie: "YOUR_AUTH_COOKIE"
  };
  const body = await req.loadString();
  const trimmed = body.trim();

  if (!trimmed) {
    throw new Error("Empty response from widget endpoint.");
  }

  if (trimmed.startsWith("<") || trimmed.startsWith("<!DOCTYPE")) {
    throw new Error("Endpoint returned HTML instead of JSON. Re-login and copy a fresh script.");
  }

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`Invalid JSON response: ${String(error)} | Body: ${trimmed.slice(0, 120)}`);
  }

  if (parsed && parsed.ok === false) {
    throw new Error(parsed.error || "Endpoint returned an error");
  }

  return parsed;
}

function addText(stack, text, size = 12, color = Color.dynamicColor(new Color("#1F2D2B"), new Color("#FFFFFF")), weight = "regular") {
  const t = stack.addText(text);
  t.font = Font.systemFont(size);
  if (weight === "semibold") t.font = Font.semiboldSystemFont(size);
  t.textColor = color;
}

async function buildWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#E6F0EE");
  widget.setPadding(14, 14, 14, 14);

  let summary;
  try {
    summary = await fetchSummary();
  } catch (error) {
    addText(widget, "Goal Tracker", 14, new Color("#2F5D5A"), "semibold");
    widget.addSpacer(6);
    addText(widget, "Widget auth/data error", 11, new Color("#8B0000"), "semibold");
    widget.addSpacer(4);
    addText(widget, String(error), 9, new Color("#1F2D2B"));
    widget.addSpacer(4);
    addText(widget, "Re-login, then copy a fresh script.", 9, new Color("#6B7F7C"));
    return widget;
  }

  addText(widget, "Goal Tracker", 14, new Color("#2F5D5A"), "semibold");
  widget.addSpacer(6);
  addText(widget, `Active: ${summary.completionPercent}%`, 12, new Color("#1F2D2B"), "semibold");
  addText(widget, `Tasks: ${summary.completedActiveTasks}/${summary.totalActiveTasks}`, 11, new Color("#6B7F7C"));
  widget.addSpacer(4);
  addText(widget, summary.nextIncompleteTask ? `Next: ${summary.nextIncompleteTask.title}` : "All tasks complete", 11);

  return widget;
}

const widget = await buildWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentSmall();
}
Script.complete();
