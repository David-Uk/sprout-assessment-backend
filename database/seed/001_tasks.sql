-- Sample tasks covering all statuses. Safe to re-run: rows are matched by title.
INSERT INTO tasks (title, description, status)
SELECT v.title, v.description, v.status
FROM (VALUES
  ('Write project README', 'Document setup, env vars and API usage', 'completed'),
  ('Design database schema', 'Define the tasks table and status constraint', 'completed'),
  ('Build task list endpoint', 'Return tasks with an optional status filter', 'in_progress'),
  ('Add status filter to UI', 'All / Pending / In Progress / Completed', 'pending'),
  ('Configure CORS for client', 'Allow the frontend origin on the API', 'pending')
) AS v(title, description, status)
WHERE NOT EXISTS (
  SELECT 1 FROM tasks t WHERE t.title = v.title
);
