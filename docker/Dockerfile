# Bước 1: Chọn Image nền (nên dùng bản Apache để có sẵn Web Server)
FROM php:8.1-apache-bullseye

# Bước 2: Thiết lập thư mục làm việc trong container
WORKDIR /var/www/html

# Bước 3: Copy toàn bộ code từ máy bạn vào container
# Forward Authorization header to PHP (needed for Bearer token auth via /save)
RUN a2enmod rewrite && \
    { \
      echo '<IfModule mod_setenvif.c>'; \
      echo '  SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1'; \
      echo '</IfModule>'; \
    } > /etc/apache2/conf-available/forward-auth.conf && \
    a2enconf forward-auth
COPY ./app/ /var/www/html/

# Bước 4: Xử lý quyền hạn (CỰC KỲ QUAN TRỌNG)
# Apache chạy dưới user 'www-data'. Ta cần cho user này sở hữu thư mục code
# để PHP có quyền ghi vào file data.txt
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Bước 5: Mở cổng 80 để truy cập web
EXPOSE 80

# Bước 6: Lệnh khởi chạy Apache (đã có sẵn trong image gốc nên không nhất thiết phải viết lại)
CMD ["apache2-foreground"]
