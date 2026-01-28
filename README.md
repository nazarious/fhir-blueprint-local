# FHIR Blueprint Local

Dieses Repository enthält die lokale Entwicklungsversion des FHIR-Blueprint-Projekts. Im Gegensatz zur Web-Version verzichtet dieses Setup auf komplexe Proxy-Strukturen (Traefik) und SSL-Zertifikate, um einen schnellen Start auf jedem lokalen Rechner (Ubuntu, macOS oder Windows) zu ermöglichen.

## Systemvoraussetzungen
* **Docker** & **Docker Compose**
* **Git**

## Schnellstart-Anleitung

### 1. Repository klonen
```bash
git clone https://github.com/Nazar/fhir-blueprint-local.git
cd fhir-blueprint-local
```

### 2. Infrastruktur starten
```bash
docker compose up -d
```

### 3. Beispieldaten laden
```bash
docker compose run --rm data-loader
```

---

## Zugriff
* **Web-Client:** http://localhost:3000
* **FHIR API:** http://localhost:8080/fhir

## Konfigurationsdetails
* **Frontend-Verbindung**: Die API-URL im Web-Client (`web-client/src/App.js`) ist auf `http://localhost:8080/fhir` vorkonfiguriert.
* **CORS**: Der FHIR-Server erlaubt Anfragen vom Frontend über die Umgebungsvariable `hapi_fhir_cors_allowed_origin=http://localhost:3000`.
