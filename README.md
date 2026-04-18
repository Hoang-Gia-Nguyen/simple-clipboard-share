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
4. **Deployment**: Use `wrangler deploy` to deploy your Cloudflare Worker.
   - **Secret Setup**: Before deployment, set up your secret using `wrangler secret put EXPECTED_SECRET`
5. **Access**: Once deployed, you can access your Cloudflare Worker via `https://your-worker-url/<EXPECTED_SECRET>`

## Docker
To deploy using Docker, follow these steps:

1. **Deployment**: Use `docker compose up -d --build` to deploy your application.
   - **Secret Setup**: Before deployment, set up your secret in docker compose
   ```
   environment:
      - SECRET_KEY=abcx
   ```
2. **Access**: After deployment, your Cloudflare Worker can be reached at `https://<YOUR_DOCKER_HOST>:<PORT>/<SECRET_KEY>`. If you need public access, expose the Docker container’s port or use a reverse‑proxy; otherwise the service can run locally without any extra configuration.

# Additional Information
{{ TO DO: Add technical requirements, dependencies, and compatibility information }}

# Troubleshooting
{{ TO DO: List common issues and their solutions, including error messages and debugging tips }}

# Future Plans
- API endpoint for cli accessed.