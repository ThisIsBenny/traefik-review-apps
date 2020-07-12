_**Traefik-Review-Apps** — New Review Apps on Demand_

## Feature
* Deploy your Review App Docker Image via POST Request
* Add new Docker Image automaticly to to Treafik Network
* Send ENV and additional Labels with the POST Request
* Stop and remove Docker Images by Hostname

## Installalation
This Example shows how traefik-review-apps can be installed via Docker-Compose.
The environment variables registry_username, registry_password and traefik_certresolver are optional.
If traefik_certresolver is set, tls will be set to true.

```YAML
traefik-review-apps:
    image: registry.gitlab.com/benny/traefik-review-apps:latest
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
      - traefik.http.routers.traefik-review-apps:.rule=Host(`deploy.example.com`)
      - traefik.http.routers.traefik-review-apps:.tls=true
      - traefik.http.routers.traefik-review-apps:.tls.certresolver=mytlschallenge
    networks:
      - traefik-network
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

## Usage

### Start a new App
```bash
curl -s -X POST 'https://deploy.example.com/start' \
-H 'Authorization: TopSecret' \
-H 'Content-Type: application/json' \
--data-raw '{
    "image": "cool-docker-app:feature-new-login",
    "hostname": "feature-new-login.example.com"
}'

```

### Stop a App
```bash
curl -s -X POST 'https://deploy.example.com/stop' \
-H 'Authorization: TopSecret' \
-H 'Content-Type: application/json' \
--data-raw '{
    "hostname": "feature-new-login.example.com"
}'

```