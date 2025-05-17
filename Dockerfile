# frontend/Dockerfile
# Dockerfile per l'ambiente di sviluppo Frontend Angular

# Usa un'immagine Node.js come base, versione Alpine per leggerezza
FROM node:20-alpine
LABEL stage="angular-development-environment"

# Installa Angular CLI globalmente nell'immagine.
# Questo permette di usare 'ng' direttamente nel CMD.
RUN npm install -g @angular/cli@latest

# Imposta la directory di lavoro all'interno del container.
# Tutti i comandi successivi verranno eseguiti in questo contesto.
WORKDIR /app

# Copia i file di definizione del progetto.
# Questi sono necessari per 'npm install' se la directory node_modules (montata come volume)
# è inizialmente vuota o se il flag '.install-complete' non è presente.
# 'ng serve' (eseguito nel CMD) userà i file dal volume mappato per src/, angular.json, ecc.
COPY package.json ./
COPY package-lock.json* ./

# Le seguenti direttive COPY sono opzionali per un ambiente di sviluppo con volumi,
# ma potrebbero essere necessarie se gli script 'npm install' (eseguiti nel CMD)
# dipendono dalla presenza di questi file nell'immagine prima che i volumi siano attivi,
# o se si verificano problemi di risoluzione iniziali.
# Di solito, 'ng serve' legge questi file direttamente dai volumi mappati.
# Se si verificano errori 'lstat' durante la build dell'immagine perché questi file
# non esistono nel contesto di build (la tua directory locale 'frontend/'),
# puoi crearli (anche vuoti se non hai configurazioni specifiche) o tenerli commentati.
# COPY angular.json ./
# COPY tsconfig.json ./
# COPY tsconfig.app.json ./
# COPY tsconfig.spec.json ./
# COPY .npmrc ./
# COPY .browserslistrc ./

# Esponi la porta su cui Angular CLI server girerà all'interno del container.
# La mappatura effettiva all'host avviene nel compose.yaml.
EXPOSE 4200

# Comando per avviare l'ambiente di sviluppo.
# Questo script viene eseguito quando il container parte.
# 1. Controlla se la directory 'node_modules' esiste o se un file flag '.install-complete' è presente.
#    Il file '.install-complete' viene creato dopo un 'npm install' di successo per evitare
#    di rieseguire 'npm install' ad ogni avvio se le dipendenze sono già nel volume.
# 2. Se le dipendenze non sembrano installate, esegue 'npm install'.
#    Se il tuo progetto richiede '--legacy-peer-deps', aggiungilo qui: npm install --legacy-peer-deps
# 3. Infine, avvia il server di sviluppo Angular ('ng serve') con:
#    --host 0.0.0.0: Rende il server accessibile dall'esterno del container (necessario per la mappatura delle porte).
#    --port 4200: Specifica la porta su cui il server ascolta all'interno del container.
#    --poll 1000: Abilita il polling per il rilevamento delle modifiche dei file, utile in alcuni ambienti Docker
#                 dove il rilevamento eventi standard del filesystem potrebbe non funzionare bene con i volumi mappati.
#    --proxy-config proxy.conf.json: Applica la configurazione del proxy per le chiamate API al backend.
CMD sh -c " \
      if [ ! -d \"node_modules\" ] || [ ! -f \"node_modules/.install-complete\" ]; then \
        echo 'Installazione dipendenze npm...' && \
        npm install && \
        touch node_modules/.install-complete && \
        echo 'Dipendenze npm installate.'; \
      else \
        echo 'Dipendenze npm già installate (trovata cartella node_modules o flag .install-complete).'; \
      fi && \
      echo 'Ambiente di sviluppo pronto. Puoi avviare ng serve manualmente.' && \
      echo 'Esempio: docker-compose exec frontend ng serve --host 0.0.0.0 --port 4200 --poll 1000 --proxy-config proxy.conf.json' && \
      tail -f /dev/null \
    "