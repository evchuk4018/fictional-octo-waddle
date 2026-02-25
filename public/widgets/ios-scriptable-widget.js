const endpoint = "https://YOUR_DOMAIN/api/widgets/summary";

async function fetchSummary() {
  const req = new Request(endpoint);
  req.method = "GET";
  req.headers = {
    Cookie: "YOUR_AUTH_COOKIE"
  };
  return await req.loadJSON();
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

  const summary = await fetchSummary();

  addText(widget, "Goal Tracker", 14, new Color("#2F5D5A"), "semibold");
  widget.addSpacer(6);
  addText(widget, `Today: ${summary.completionPercent}%`, 12, new Color("#1F2D2B"), "semibold");
  addText(widget, `Tasks: ${summary.completedTodayTasks}/${summary.totalTodayTasks}`, 11, new Color("#6B7F7C"));
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
