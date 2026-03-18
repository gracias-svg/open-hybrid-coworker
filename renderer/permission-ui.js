/*
==================================
OCC PERMISSION UI
==================================
Displays approval dialog in UI
*/

export function showPermissionDialog(action, details) {

  const container = document.createElement("div");

  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.background = "#1e1e1e";
  container.style.color = "white";
  container.style.padding = "16px";
  container.style.borderRadius = "8px";
  container.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
  container.style.zIndex = "9999";

  const text = document.createElement("div");
  text.innerText = `⚠️ Agent requests permission:\n${action}`;

  const approve = document.createElement("button");
  approve.innerText = "Approve";

  const deny = document.createElement("button");
  deny.innerText = "Deny";

  approve.style.marginRight = "10px";

  approve.onclick = () => {
    window.api.approvePermission(action, details);
    container.remove();
  };

  deny.onclick = () => {
    window.api.denyPermission(action);
    container.remove();
  };

  container.appendChild(text);
  container.appendChild(document.createElement("br"));
  container.appendChild(approve);
  container.appendChild(deny);

  document.body.appendChild(container);

}

window.showPermissionDialog = showPermissionDialog;