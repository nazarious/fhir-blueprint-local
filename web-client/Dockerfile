# Schritt 1: Das React-Projekt bauen
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
# Wir nutzen --legacy-peer-deps wegen des react-json-view Konflikts
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Schritt 2: Die fertigen Dateien mit Nginx ausliefern
FROM nginx:stable-alpine
# Kopiert das Build-Ergebnis in das Standardverzeichnis von Nginx
COPY --from=build /app/build /usr/share/nginx/html
# Exponiert Port 80 (Standard für Web)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
