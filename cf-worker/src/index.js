export default {
  // CORS headers used for all responses
  corsHeaders: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  },

  // Helper to escape HTML safely
  escapeHTML(content) {
    return String(content)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  async fetch(request, env) {
    // 1. ENVIRONMENT VALIDATION
    if (!env.EXPECTED_SECRET) {
      return new Response("Error: EXPECTED_SECRET environment variable is not set.", { status: 500, headers: this.corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    // Optional analytics
    if (env.TEXTBIN_AE) {
      env.TEXTBIN_AE.writeDataPoint({
        indexes: [path],
        blobs: [userAgent, ip],
        doubles: [Date.now()]
      });
    }

    // OPTIONS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: this.corsHeaders });
    }

    // Favicon
    if (path === '/favicon.ico') {
      return fetch('https://img.icons8.com/fluency/48/note.png');
    }

    // ===== POST /auth: Verify password and return note content =====
    if (path === '/auth') {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405, headers: this.corsHeaders });
      }

      const formData = await request.formData();
      const password = formData.get("password") ?? "";

      if (password !== env.EXPECTED_SECRET) {
        return new Response("Invalid password", { status: 401, headers: this.corsHeaders });
      }

      // Password correct — return the saved note content
      const content = await env.QUICK_NOTE.get("note") || "";
      return new Response(content, { status: 200, headers: this.corsHeaders });
    }

    // ===== POST /save: Save note content (requires Authorization) =====
    if (path === '/save') {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405, headers: this.corsHeaders });
      }

      const auth = request.headers.get("Authorization") || "";
      const password = auth.replace("Bearer ", "");

      if (password !== env.EXPECTED_SECRET) {
        return new Response("Access denied", { status: 401, headers: this.corsHeaders });
      }

      try {
        const formData = await request.formData();
        const text = formData.get("text") ?? "";
        await env.QUICK_NOTE.put("note", text);
        return new Response("OK", { status: 200, headers: this.corsHeaders });
      } catch (e) {
        return new Response("Error: Could not write to storage", { status: 500 });
      }
    }

    // ===== GET /*: Serve the HTML page (no auth needed for the page itself) =====
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quick Note</title>
  <link rel="icon" type="image/png" href="https://img.icons8.com/fluency/48/note.png">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #eee; height: 100vh; }

    /* Password Modal */
    #passwordModal {
      position: fixed; inset: 0; z-index: 100;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.4);
    }
    #passwordBox {
      background: #fff; padding: 40px; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      text-align: center; min-width: 320px;
    }
    #passwordBox h2 { margin-bottom: 20px; font-size: 20px; color: #333; }
    #passwordInput {
      width: 100%; padding: 12px 16px; font-size: 16px;
      border: 2px solid #ddd; border-radius: 8px; outline: none;
      margin-bottom: 16px; transition: border-color 0.2s;
    }
    #passwordInput:focus { border-color: #4A90D9; }
    #authBtn {
      width: 100%; padding: 12px; font-size: 16px; font-weight: 600;
      background: #4A90D9; color: #fff; border: none; border-radius: 8px;
      cursor: pointer; transition: background 0.2s;
    }
    #authBtn:hover { background: #357ABD; }
    #authBtn:disabled { background: #999; cursor: not-allowed; }
    #authError { color: #e74c3c; font-size: 14px; margin-top: 12px; min-height: 20px; }

    /* Editor */
    #editor { display: none; }
    #toolbar { position: fixed; top: 5px; right: 5px; display: flex; align-items: center; gap: 10px; z-index: 10; }
    #status { font-size: 12px; color: gray; }
    button { cursor: pointer; padding: 4px 8px; border: 1px solid #ccc; background: #fff; border-radius: 4px; font-size: 12px; }
    button:hover { background: #f0f0f0; }
    textarea {
      width: 100vw;
      height: 100vh;
      padding: 20px;
      border: none;
      outline: none;
      font-size: 18px;
      box-sizing: border-box;
      resize: none;
      background: #fff;
      color: #000;
    }

    @media (prefers-color-scheme: dark) {
      body { background: #222; }
      textarea { background: #333; color: #eee; }
      #status { color: #aaa; }
      #toolbar button { background: #444; color: #eee; border-color: #555; }
      #toolbar button:hover { background: #555; }
      #passwordBox { background: #333; }
      #passwordBox h2 { color: #eee; }
      #passwordInput { background: #444; color: #eee; border-color: #555; }
    }
  </style>
</head>
<body>
  <!-- Password Modal -->
  <div id="passwordModal">
    <div id="passwordBox">
      <h2>Enter Password</h2>
      <input type="password" id="passwordInput" placeholder="Password" autofocus />
      <button id="authBtn">Submit</button>
      <div id="authError"></div>
    </div>
  </div>

  <!-- Editor (hidden until authenticated) -->
  <div id="editor">
    <div id="toolbar">
      <div id="status">Ready</div>
      <button id="copyBtn">Copy</button>
    </div>
    <textarea id="note" placeholder="Start typing..."></textarea>
  </div>

  <script>
    let PASSWORD = '';
    const note = document.getElementById('note');
    const status = document.getElementById('status');
    const copyBtn = document.getElementById('copyBtn');
    const modal = document.getElementById('passwordModal');
    const editor = document.getElementById('editor');
    const authBtn = document.getElementById('authBtn');
    const passwordInput = document.getElementById('passwordInput');
    const authError = document.getElementById('authError');
    let saveTimer;

    // Authentication
    async function authenticate() {
      const pw = passwordInput.value;
      if (!pw) return;
      authBtn.disabled = true;
      authBtn.innerText = 'Verifying...';
      authError.textContent = '';

      const fd = new FormData();
      fd.append('password', pw);
      try {
        const res = await fetch('/auth', { method: 'POST', body: fd });
        if (res.ok) {
          PASSWORD = pw;
          modal.style.display = 'none';
          editor.style.display = 'block';
          note.value = await res.text();
          // Re-focus the textarea after auth
          setTimeout(() => note.focus(), 100);
        } else {
          authError.textContent = 'Invalid password';
          passwordInput.value = '';
          passwordInput.focus();
        }
      } catch (err) {
        authError.textContent = 'Connection error';
      } finally {
        authBtn.disabled = false;
        authBtn.innerText = 'Submit';
      }
    }

    authBtn.addEventListener('click', authenticate);
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') authenticate();
    });

    // Copy
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(note.value);
        const oldText = copyBtn.innerText;
        copyBtn.innerText = "Copied!";
        setTimeout(() => copyBtn.innerText = oldText, 2000);
      } catch (err) {
        alert("Failed to copy text");
      }
    });

    // Auto-save
    note.addEventListener('input', () => {
      status.innerText = "Typing...";
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        status.innerText = "Saving...";
        const fd = new FormData();
        fd.append('text', note.value);
        try {
          const res = await fetch('/save', {
            method: 'POST',
            body: fd,
            headers: { 'Authorization': 'Bearer ' + PASSWORD }
          });
          if (res.ok) {
            status.innerText = "Saved at " + new Date().toLocaleTimeString();
            status.style.color = "gray";
          } else if (res.status === 401) {
            status.innerText = "SESSION EXPIRED — Reload to re-authenticate";
            status.style.color = "red";
          } else {
            status.innerText = "SERVER ERROR";
            status.style.color = "red";
          }
        } catch (e) {
          status.innerText = "CONNECTION ERROR";
          status.style.color = "red";
        }
      }, 800);
    });
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: { ...this.corsHeaders, "Content-Type": "text/html; charset=UTF-8" }
    });
  }
};
