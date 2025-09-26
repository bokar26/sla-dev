export default function Health() {
  return (
    <div style={{ padding: 24 }}>
      <h1>✅ Admin Router Health Check</h1>
      <p>This page is rendered from <code>/admin/_health</code>.</p>
      <ul>
        <li><a href="/admin/overview">Go to Overview</a></li>
        <li><a href="/admin/users">Go to Users</a></li>
      </ul>
    </div>
  );
}
