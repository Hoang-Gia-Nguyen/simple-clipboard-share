# Introduction
This is a simple text bin. Paste any snippet, get a short URL, and access it from any machine with a simple public url.

It has 2 methods to deploy:
* Cloudflare worker
* Docker

# Deployment Methods
## Cloudflare Worker
To deploy as a Cloudflare Worker, follow these steps:

1. **Prerequisite**: Install the Wrangler CLI.
2. **Configuration**: Prefer using `wrangler.example.toml`. Update your information in this file and save as `wrangler.toml`.
3. **Local Development**: Run `wrangler dev` for local development. Ensure you have a `.env` file with the `EXPECTED_SECRET` value (refer `.example.env`).
4. **Deployment**:
   - Set up your secret: `wrangler secret put EXPECTED_SECRET`
   - Deploy: `wrangler deploy`
5. **Access**: Visit the worker URL and enter your password (the `EXPECTED_SECRET` value) in the password prompt.

## Docker
To deploy using Docker, follow these steps:

1. **Deployment**: Use `docker compose up -d --build` to deploy your application.
   - **Secret Setup**: Before deployment, set up your secret in docker compose
   ```
   environment:
      - SECRET_KEY=abcx
   ```
2. **Access**: After deployment, your service can be reached at `https://<YOUR_DOCKER_HOST>:<PORT>/`. Enter the secret key in the password prompt to access the note editor.

# Additional Information
{{ TO DO: Add technical requirements, dependencies, and compatibility information }}

# Troubleshooting
{{ TO DO: List common issues and their solutions, including error messages and debugging tips }}

# Future Plans
- API endpoint for cli accessed.
