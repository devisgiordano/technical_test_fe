# frontend/Dockerfile
# Dockerfile per Frontend Angular (Produzione)
# Assumes Angular project files (package.json, angular.json, src/, etc.)
# are in the build context (la directory 'frontend/' sull'host).

# Fase 1: Costruzione dell'applicazione Angular (Builder)
FROM node:20-alpine AS builder
LABEL stage="angular-builder"

# Installa Angular CLI globalmente per il comando 'ng build'
RUN npm install -g @angular/cli@latest

# Imposta la directory di lavoro nel container builder
WORKDIR /app

# Copia i file di configurazione principali del progetto Angular.
# Questi file saranno creati nella directory 'frontend/' dell'host
# dal comando 'ng new'.
COPY package.json package-lock.json* angular.json tsconfig.*.json ./
# Copia altri file di configurazione comuni se presenti (opzionale)
COPY .npmrc .browserslistrc ./ 2>/dev/null || true

# Copia la directory 'src' del progetto Angular
COPY src ./src

# Installa le dipendenze del progetto
RUN npm install --legacy-peer-deps

# Esegui la build dell'applicazione Angular per la produzione.
# Il nome del progetto (es. 'angular-app-name') è preso da angular.json,
# e l'output sarà in 'dist/angular-app-name'.
# Assicurati che il nome qui sotto corrisponda a quello usato in 'ng new'
# e nel comando COPY della fase Nginx. Per semplicità, useremo 'frontend_app_name'.
RUN ng build --configuration production
# Se ng build fallisce per memoria: NODE_OPTIONS=--max-old-space-size=4096 ng build --configuration production

# Fase 2: Configurazione del server Nginx (Produzione)
FROM nginx:1.25-alpine AS production
LABEL stage="nginx-production"

# Rimuovi la configurazione di default di Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia la configurazione personalizzata di Nginx
# (da frontend/nginx/default.conf sull'host)
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copia i file compilati dell'applicazione Angular dalla fase di build.
# !!! IMPORTANTE: Sostituisci 'frontend_app_name' con il nome effettivo del tuo progetto Angular
# (lo stesso nome che userai nel comando 'ng new ... --directory .').
# Questo nome determina la cartella di output in /app/dist/frontend_app_name.
COPY --from=builder /app/dist/frontend /usr/share/nginx/html

# Esponi la porta 80
EXPOSE 80

# Comando per avviare Nginx
CMD ["nginx", "-g", "daemon off;"]

# Healthcheck per Nginx
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --spider http://localhost/ || exit 1
