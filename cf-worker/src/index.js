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

    const url = new URL(request.url)
    const path = url.pathname
    const userAgent = request.headers.get("user-agent") || "unknown"
    const ip = request.headers.get("CF-Connecting-IP") || "unknown"

    // Optional analytics
    if (env.TEXTBIN_AE) {
      env.TEXTBIN_AE.writeDataPoint({
        indexes: [path],
        blobs: [userAgent, ip],
        doubles: [Date.now()]
      })
    }

    if (url.pathname === '/favicon.ico') {
      return fetch('https://img.icons8.com/fluency/48/note.png')
    }

    const ALLOWED_URLS = [
      '/.well-known/appspecific/com.chrome.devtools.json',
      '/favicon.ico',
      `/${env.EXPECTED_SECRET}`
    ]

    if (request.method === "OPTIONS") {
  return new Response(null, { status: 200, headers: this.corsHeaders });
}

if (!ALLOWED_URLS.includes(url.pathname)) {
  console.log(`Access denied for path: ${url.pathname}`);
  return new Response("Access denied", { status: 403, headers: this.corsHeaders });
}

    // ===== POST: Save data =====
    if (request.method === "POST") {
      try {
        const formData = await request.formData()
        const text = formData.get("text") ?? ""

        await env.QUICK_NOTE.put("note", text)

        return new Response("OK", { status: 200, headers: this.corsHeaders })
      } catch (e) {
        return new Response(
          "Error: Could not write to storage",
          { status: 500 }
        )
      }
    }

    // ===== GET: Load data =====
    const content = await env.QUICK_NOTE.get("note") || ""

    const escaped = this.escapeHTML(content)

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quick Note</title>
  <link rel="icon" type="image/png" href="https://img.icons8.com/fluency/48/note.png">
  <style>
    body { margin: 0; background: #eee; font-family: sans-serif; }
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
      button { background: #444; color: #eee; border-color: #555; }
      button:hover { background: #555; }
    }
  </style>
</head>
<body>
  <div id="toolbar">
    <div id="status">Ready</div>
    <button id="copyBtn">Copy</button>
  </div>
  <textarea id="note" placeholder="Start typing...">${escaped}</textarea>

  <script>
    const note = document.getElementById('note')
    const status = document.getElementById('status')
    const copyBtn = document.getElementById('copyBtn')
    let timer

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(note.value)
        const oldText = copyBtn.innerText
        copyBtn.innerText = "Copied!"
        setTimeout(() => copyBtn.innerText = oldText, 2000)
      } catch (err) {
        alert("Failed to copy text")
      }
    })

    note.addEventListener('input', () => {
      status.innerText = "Typing..."
      clearTimeout(timer)

      timer = setTimeout(async () => {
        status.innerText = "Saving..."
        const fd = new FormData()
        fd.append('text', note.value)

        try {
          const res = await fetch('', { method: 'POST', body: fd })
          if (res.ok) {
            status.innerText = "Saved at " + new Date().toLocaleTimeString()
            status.style.color = "gray"
          } else if (res.status === 401) {
            status.innerText = "ACCESS DENIED (Invalid secret)"
            status.style.color = "red"
          } else {
            status.innerText = "SERVER ERROR (Check KV bindings)"
            status.style.color = "red"
          }
        } catch (e) {
          status.innerText = "CONNECTION ERROR"
          status.style.color = "red"
        }
      }, 800)
    })
  </script>
</body>
</html>`

    return new Response(html, {
      headers: { ...this.corsHeaders, "Content-Type": "text/html; charset=UTF-8" }
    })
  }
}
