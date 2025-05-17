# Progetto Frontend Gestione Ordini (Angular)

Questo è il frontend per l'applicazione di gestione degli ordini, sviluppato con Angular. Interagisce con un backend Symfony (eseguito separatamente) per visualizzare e gestire gli ordini. Il progetto è configurato per essere eseguito come microservizio Docker.

## Prerequisiti

Prima di iniziare, assicurati di avere installato sul tuo sistema:

* **Git:** Per clonare il repository.
* **Docker:** Per eseguire l'applicazione in container.
* **Docker Compose:** Per orchestrare i container (solitamente incluso con Docker Desktop).



## Installazione e Avvio con Docker

Segui questi passaggi per installare ed eseguire il frontend utilizzando Docker:

**1. Clonare il Repository del Frontend**



```
git clone https://github.com/devisgiordano/technical_test_fe.git frontend
```

Entrare nella directory
```
cd frontend
```

**2. Lanciare/costruire il container**
```
docker compose up --build -d
```

**3. Entrare nel container e lanciare il server web**
```
docker exec -it frontend_angular_dev sh
```

dalla cartella /app lanciare:

```
ng serve --host 0.0.0.0 --port 4200 --poll 1000 --proxy-config proxy.conf.json
```
il frontend sarà disponibile all'indirizzo: http://localhost:4200