export function ok(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

export function created(res, data) {
  res.status(201).json({ success: true, data });
}
