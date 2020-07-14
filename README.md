_**Traefik-Review-Apps** — Review Apps on Demand_

With Traefik-Review-Apps you have the possibilty to deploy your review apps on demand as part of your CI/CD Pipeline.
Send the Docker Image Name and the Hostname for the Review App to Traefik-Review-Apps.
Traefik-Review-Apps will pull the image, create a Container with Traefik Router-Settings and start the new Container.

## Feature

* Deploy your Review App Docker Image via POST Request
* Add new Docker Image automatically to to Treafik Network
* Send Environment Variable and additional Labels with the POST Request
* Stop and remove Docker Images by Hostname

## Installalation

This Example shows how traefik-review-apps can be installed via Docker-Compose.
The environment variables registry_username, registry_password and traefik_certresolver are optional.
If traefik_certresolver is set, tls will be set to true.

```YAML
traefik-review-apps:
    image: registry.gitlab.com/benny/traefik-review-apps:stable
    restart: on-failure
    hostname: deploy.example.com
    environment:
      apikey: TopSecret
      registry_username: ...
      registry_password: ...
      traefik_network: traefik-network
      traefik_certresolver: mytlschallenge
    labels:
      - traefik.enable=true
      - traefik.http.routers.traefik-review-apps.rule=Host(`deploy.example.com`)
      - traefik.http.routers.traefik-review-apps.tls=true
      - traefik.http.routers.traefik-review-apps.tls.certresolver=mytlschallenge
    networks:
      - traefik-network
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

### Plugins

traefik-review-apps supports various plugins, which are executed on failure or before and after a deployment.
To use a plugin, the plugin name must be added to the environment variable `plugins` (comma separated list). For example: `plugins=pushcut,msteams`

**the following plugins are available:**

* pushcut
  * environment variables:
    * `plugins_pushcut_url` (required): PushCut URL
* webhook
  * environment variables:
    * `plugins_webhook_urls` (required): comma separated list of urls, e.g. `https://webhook.site/54c1b34c-be49-4a2f-986d-716856ee583f,https://webhook.site/74e307f1-c327-4324-a407-280b116b1933`
  * Attributes of Webhook POST-Request:
    * `action` - Possible values: `deployment`, `teardown`
    * `status` - Possible values: `started`, `success`, `failed`
    * `image` - Only for `action` == `image`
    * `hostname`
    * `errorMessage` - Only for `event` == `failure`

## Usage

### Start a new App

**Simple:**

```bash
curl -X POST 'https://deploy.example.com/start' \
-H 'Authorization: TopSecret' \
-H 'Content-Type: application/json' \
--data-raw '{
    "image": "cool-docker-app:feature-new-login",
    "hostname": "feature-new-login.example.com"
}'
```

**With ENVs:**

```bash
curl -X POST 'https://deploy.example.com/start' \
-H 'Authorization: TopSecret' \
-H 'Content-Type: application/json' \
--data-raw '{
    "image": "cool-docker-app:feature-new-login",
    "hostname": "feature-new-login.example.com"
    "env": ["DATABASE_URI=https://...", "DATADOG_APIKEY=1234"]
}'

```

### Stop a App

```bash
curl -X POST 'https://deploy.example.com/stop' \
-H 'Authorization: TopSecret' \
-H 'Content-Type: application/json' \
--data-raw '{
    "hostname": "feature-new-login.example.com"
}'

```
