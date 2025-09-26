export default function HelloAdmin() {
  return (
    <div style={{ padding: 24 }}>
      <h1>👋 Hello Admin</h1>
      <p>If you see this, routing and layout are working.</p>
      <ul>
        <li><a href="/admin/overview">/admin/overview</a></li>
        <li><a href="/admin/users">/admin/users</a></li>
      </ul>
    </div>
  );
}
