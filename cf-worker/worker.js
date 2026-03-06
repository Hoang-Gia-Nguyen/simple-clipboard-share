export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    const path = url.pathname
    const userAgent = request.headers.get("user-agent") || "unknown"
    const ip = request.headers.get("CF-Connecting-IP") || "unknown"

    env.TEXTBIN_AE.writeDataPoint({
      indexes: [path],
      blobs: [userAgent, ip],
      doubles: [Date.now()]
    })

    if (url.pathname === '/favicon.ico') {
      return fetch('https://img.icons8.com/fluency/48/note.png')
    }

    const ALLOWED_URLS = [
      '/.well-known/appspecific/com.chrome.devtools.json',
      '/favicon.ico',
      `/${env.EXPECTED_SECRET}`
    ]

    // const expectedSecret = env.EXPECTED_SECRET

    // const urlParams = new URL(request.url).searchParams;
    // const secretFromUrl = urlParams.get('secret');


    if (!ALLOWED_URLS.includes(url.pathname)) {
      console.log(url.href) // prints the full URL for debugging
      return new Response("Access denied", { status: 401 })
    }

    // ===== POST: lưu dữ liệu =====
    if (request.method === "POST") {
      try {
        const formData = await request.formData()
        const text = formData.get("text") ?? ""

        await env.QUICK_NOTE.put("note", text)

        return new Response("OK", { status: 200 })
      } catch (e) {
        return new Response(
          "Lỗi: Không ghi được dữ liệu",
          { status: 500 }
        )
      }
    }

    // ===== GET: load dữ liệu =====
    const content = await env.QUICK_NOTE.get("note") || ""

    const escaped = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quick Note</title>
  <style>
    body { margin: 0; background: #eee; font-family: sans-serif; }
    #status { position: fixed; top: 5px; right: 5px; font-size: 12px; color: gray; }
    textarea {
      width: 100vw;
      height: 100vh;
      padding: 20px;
      border: none;
      outline: none;
      font-size: 18px;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="status">Sẵn sàng</div>
  <textarea id="note">${escaped}</textarea>

  <script>
    const note = document.getElementById('note')
    const status = document.getElementById('status')
    let timer

    note.addEventListener('input', () => {
      status.innerText = "Đang gõ..."
      clearTimeout(timer)

      timer = setTimeout(async () => {
        status.innerText = "Đang lưu..."
        const fd = new FormData()
        fd.append('text', note.value)

        try {
          const res = await fetch('', { method: 'POST', body: fd })
          if (res.ok) {
            status.innerText = "Đã lưu lúc " + new Date().toLocaleTimeString()
          } else {
            status.innerText = "LỖI SERVER"
          }
        } catch (e) {
          status.innerText = "LỖI KẾT NỐI"
        }
      }, 800)
    })
  </script>
</body>
</html>`

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=UTF-8" }
    })
  }
}
