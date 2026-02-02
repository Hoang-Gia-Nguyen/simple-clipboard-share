## Project Overview

This project provides a simple note-taking web application using PHP and Docker Compose. The application allows users to edit and save text content.

## Prerequisites

- Docker and Docker Compose installed on your system.

## Setup and Run

1. Clone or download the project directory.
2. Navigate to the project directory in your terminal.
3. Run the following command to start the application:
   ```
   docker-compose up -d
   ```
   This will start the PHP application in detached mode.

4. Access the application by navigating to `http://localhost:8099` in your web browser.

## Application Usage

- The application provides a simple text area for note-taking.
- As you type, the application will automatically save your notes to a file named `data.txt` on the server.
- The application displays the last saved status at the top right corner.

## Notes

- Ensure you have write permissions in the project directory for the `data.txt` file.
- You can stop the application by running `docker-compose down` in the terminal.

## Future Enhancements

- Implement additional features such as user authentication, data encryption, or more sophisticated saving mechanisms.