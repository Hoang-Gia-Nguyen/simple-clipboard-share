<?php
$file = 'data.txt';
$secret_key = getenv('SECRET_KEY'); // Key bảo mật của bạn

// 1. KIỂM TRA BẢO MẬT
if (!isset($_GET['secret']) || $_GET['secret'] !== $secret_key) {
    header('HTTP/1.1 401 Unauthorized');
    echo "<h1>401 Unauthorized</h1><p>Bạn không có quyền truy cập trang này.</p>";
    exit;
}

// 2. XỬ LÝ LƯU DỮ LIỆU (POST) - Vẫn giữ tham số secret khi fetch
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

// 3. ĐỌC DỮ LIỆU (GET)
$content = file_exists($file) ? htmlspecialchars(file_get_contents($file)) : '';
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Quick Note (Secure)</title>
    <link rel="icon" type="image/png" href="https://img.icons8.com/fluency/48/note.png">
    
    <style>
        body { margin: 0; background: #eee; font-family: sans-serif; }
        #status { position: fixed; top: 5px; right: 5px; font-size: 12px; color: gray; z-index: 10; }
        textarea { width: 100vw; height: 100vh; padding: 20px; border: none; outline: none; font-size: 18px; box-sizing: border-box; resize: none; }
    </style>
</head>
<body>
    <div id="status">Sẵn sàng (Bảo mật: Bật)</div>
    <textarea id="note" placeholder="Bắt đầu nhập nội dung..."><?php echo $content; ?></textarea>

    <script>
        const note = document.getElementById('note');
        const status = document.getElementById('status');
        let timer;

        // Lấy secret từ URL hiện tại để gửi kèm trong request POST
        const urlParams = new URLSearchParams(window.location.search);
        const secret = urlParams.get('secret');

        note.addEventListener('input', () => {
            status.innerText = "Đang gõ...";
            clearTimeout(timer);
            timer = setTimeout(async () => {
                status.innerText = "Đang lưu...";
                
                const fd = new FormData();
                fd.append('text', note.value);

                try {
                    // Gửi request kèm theo ?secret=abc để server cho phép ghi
                    const res = await fetch(`?secret=${secret}`, { 
                        method: 'POST', 
                        body: fd 
                    });
                    
                    if (res.ok) {
                        status.innerText = "Đã lưu lúc " + new Date().toLocaleTimeString();
                    } else if (res.status === 401) {
                        status.innerText = "LỖI: Sai mã bảo mật!";
                    } else {
                        status.innerText = "LỖI SERVER (Quyền ghi file)";
                    }
                } catch (e) {
                    status.innerText = "LỖI KẾT NỐI";
                }
            }, 800);
        });
    </script>
</body>
</html>