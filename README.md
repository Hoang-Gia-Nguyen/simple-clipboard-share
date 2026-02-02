# Simple Clipboard Share

## Folder Structure

The project consists of the following folders and files:

- `app/`: Contains the application code.
  - `index.php`: The main PHP script.
  - `data.txt`: A text file used by the application.

- `data-test.txt`: A test file used for data persistence.

## Docker Configuration

The project uses Docker for containerization. The `Dockerfile` defines a PHP 8.1 image with an Apache server.

### Dockerfile Overview

1. **Base Image**: Uses `php:8.1-apache-bullseye` as the base image.
2. **Working Directory**: Sets the working directory to `/var/www/html`.
3. **File Copying**: Copies `index.php` and `data.txt` from the `app/` directory into the container.
4. **Permissions**: Configures permissions for the Apache user.
5. **Expose Port**: Exposes port 80 for the Apache server.

## Docker Compose Configuration

The `docker-compose.yml` file defines a service named `notepad` that:

1. **Image**: Uses the `hgnguyen37/simple-clipboard` image.
2. **Ports**: Maps port 8099 on the host to port 80 in the container.
3. **Volumes**: Mounts a personal txt file from the host into the container at /var/www/html/data.txt.

## Usage

To run the application:

1. Create a personal txt file (e.g., `personal_data.txt`).
2. Update the `docker-compose.yml` file to mount your personal txt file:
   ```yml
   services:
     notepad:
       image: hgnguyen37/simple-clipboard
       container_name: my_single_note
       ports:
         - "8099:80"
       volumes:
         - ./personal_data.txt:/var/www/html/data.txt
       restart: always
   ```
3. Run Docker Compose:
   ```bash
   docker compose up -d
   ```
4. Access the application at `http://localhost:8099`.

## Notes

- Ensure you have Docker installed on your system.
- The application uses a PHP 8.1 image with Apache.
- You can customize the `docker-compose.yml` file to mount different txt files.