<?php
$file = 'data.txt';

// Xử lý lưu dữ liệu (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = $_POST['text'] ?? '';
    if (file_put_contents($file, $input) !== false) {
        echo "OK";
    } else {
        header('HTTP/1.1 500 Internal Error');
        echo "Lỗi: Không có quyền ghi vào file data.txt";
    }
    exit;
}

// Đọc dữ liệu (GET)
$content = file_exists($file) ? htmlspecialchars(file_get_contents($file)) : '';
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quick Note</title>
    <style>
        body { margin: 0; background: #eee; font-family: sans-serif; }
        #status { position: fixed; top: 5px; right: 5px; font-size: 12px; color: gray; }
        textarea { width: 100vw; height: 100vh; padding: 20px; border: none; outline: none; font-size: 18px; box-sizing: border-box; }
    </style>
</head>
<body>
    <div id="status">Sẵn sàng</div>
    <textarea id="note"><?php echo $content; ?></textarea>

    <script>
        const note = document.getElementById('note');
        const status = document.getElementById('status');
        let timer;

        // CHỈ LƯU - KHÔNG TỰ ĐỘNG LOAD VỀ ĐỂ TRÁNH XUNG ĐỘT KHI ĐANG TEST
        note.addEventListener('input', () => {
            status.innerText = "Đang gõ...";
            clearTimeout(timer);
            timer = setTimeout(async () => {
                status.innerText = "Đang lưu...";
                const fd = new FormData();
                fd.append('text', note.value);

                try {
                    const res = await fetch('', { method: 'POST', body: fd });
                    if (res.ok) {
                        status.innerText = "Đã lưu lúc " + new Date().toLocaleTimeString();
                    } else {
                        status.innerText = "LỖI SERVER (Kiểm tra quyền ghi file)";
                    }
                } catch (e) {
                    status.innerText = "LỖI KẾT NỐI";
                }
            }, 800);
        });
    </script>
</body>
</html>