/*
===================================
OCC PERMISSION SYSTEM
===================================
Non-breaking safety layer
*/

export const permissionRequests = new Map();

/*
Request permission from UI
*/

export function requestPermission(action, details = {}) {

  const id = Date.now() + "-" + Math.random();

  const request = {
    id,
    action,
    details,
    status: "pending"
  };

  permissionRequests.set(id, request);

  return request;

}

/*
Approve permission
*/

export function approvePermission(id) {

  const req = permissionRequests.get(id);

  if (!req) return false;

  req.status = "approved";

  return true;

}

/*
Deny permission
*/

export function denyPermission(id) {

  const req = permissionRequests.get(id);

  if (!req) return false;

  req.status = "denied";

  return true;

}

/*
Check permission
*/

export function getPermissionStatus(id) {

  const req = permissionRequests.get(id);

  if (!req) return null;

  return req.status;

}