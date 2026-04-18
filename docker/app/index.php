<?php
$file = 'data.txt';
$secret_key = getenv('SECRET_KEY');

// 1. ENVIRONMENT VALIDATION
if (!$secret_key) {
    http_response_code(500);
    die("Error: SECRET_KEY environment variable is not set.");
}

// 2. SECURITY CHECK
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($requestPath !== "/$secret_key") {
    http_response_code(401);
    die("Access denied");
}

// 3. HANDLE SAVE (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = $_POST['text'] ?? '';
    if (file_put_contents($file, $input) !== false) {
        echo "OK";
    } else {
        http_response_code(500);
        echo "Error: Cannot write to data.txt. Check file permissions.";
    }
    exit;
}

// 4. READ DATA (GET)
$content = file_exists($file) ? htmlspecialchars(file_get_contents($file)) : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Quick Note (Secure)</title>
    <link rel="icon" type="image/png" href="https://img.icons8.com/fluency/48/note.png">
    
    <style>
        body { margin: 0; background: #eee; font-family: sans-serif; }
        #toolbar { position: fixed; top: 5px; right: 5px; display: flex; align-items: center; gap: 10px; z-index: 10; }
        #status { font-size: 12px; color: gray; }
        button { cursor: pointer; padding: 4px 8px; border: 1px solid #ccc; background: #fff; border-radius: 4px; font-size: 12px; }
        button:hover { background: #f0f0f0; }
        textarea { width: 100vw; height: 100vh; padding: 20px; border: none; outline: none; font-size: 18px; box-sizing: border-box; resize: none; background: #fff; color: #000; }
        
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
        <div id="status">Ready (Security: On)</div>
        <button id="copyBtn">Copy</button>
    </div>
    <textarea id="note" placeholder="Start typing..."><?php echo $content; ?></textarea>

    <script>
        const note = document.getElementById('note');
        const status = document.getElementById('status');
        const copyBtn = document.getElementById('copyBtn');
        let timer;

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

        note.addEventListener('input', () => {
            status.innerText = "Typing...";
            clearTimeout(timer);
            timer = setTimeout(async () => {
                status.innerText = "Saving...";
                
                const fd = new FormData();
                fd.append('text', note.value);

                try {
                    const res = await fetch('', { method: 'POST', body: fd });
                    if (res.ok) {
                        status.innerText = "Saved at " + new Date().toLocaleTimeString();
                        status.style.color = "gray";
                    } else if (res.status === 401) {
                        status.innerText = "ACCESS DENIED (Invalid secret)";
                        status.style.color = "red";
                    } else {
                        status.innerText = "SERVER ERROR (Check permissions)";
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
</html>
