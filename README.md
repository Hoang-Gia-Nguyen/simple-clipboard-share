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

### Docker Compose Configuration

The `docker-compose.yml` file defines a service named `app` that:

1. **Builds**: Builds the Docker image from the current directory's Dockerfile.
2. **Ports**: Maps port 8090 on the host to port 80 in the container.
3. **Volumes**: Mounts `data-test.txt` from the host into the container.

## Usage

To run the application:

`docker compose up -d`

## Notes

- Ensure you have Docker installed on your system.
- The application uses a PHP 8.1 image with Apache.
- The `data-test.txt` file is used for data persistence and is mounted into the container.