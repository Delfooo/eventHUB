# EventHub

## Descrizione del progetto

EventHub è una piattaforma dove gli utenti possono:
- Creare e gestire eventi.
- Iscriversi agli eventi creati da altri.
- Ricevere notifiche in tempo reale quando qualcuno si registra.
- Comunicare tramite una chat interna per ogni evento.
- Esplorare un catalogo pubblico di eventi filtrabile per categorie, data o luogo.

Gli amministratori avranno un pannello di gestione per moderare eventi, utenti e segnalazioni.

---

## Requisiti funzionali

### A. Gestione utenti
- Registrazione, login e logout.
- Autenticazione tramite JWT.
- Ruoli utente:
  - **Utente base**: può creare eventi, iscriversi e chattare.
  - **Amministratore**: può approvare/rifiutare eventi e bloccare utenti.
- Recupero password via email (opzionale, ma consigliato).

### B. Gestione eventi
- Creazione di eventi con titolo, descrizione, data, luogo, capienza e immagine.
- Possibilità di modificare o cancellare eventi creati.
- Possibilità di iscriversi o annullare l’iscrizione a un evento.
- Lista eventi pubblici, con filtri per data, categoria e luogo.
- Dashboard personale per vedere:
  - Eventi creati.
  - Eventi a cui l’utente è iscritto.

### C. Chat e notifiche in tempo reale
- Ogni evento ha una chat interna per i partecipanti.
- Notifica live quando qualcuno si iscrive o cancella l’iscrizione.
- Notifica live agli admin se un evento viene segnalato.

### D. API pubblica e documentazione
- Tutte le funzionalità devono essere accessibili via API REST.
- Gli endpoint devono essere protetti in base ai ruoli.

### E. Funzionalità opzionali (extra)
- Integrazione di OAuth (Google, GitHub, ecc.) per login rapido.
- Validazione per nuovi iscritti attraverso email.
- Invio email di conferma iscrizione.
- Deployment completo su Render, Vercel, Railway o Heroku.

---

## Avvio rapido

1. Clona il repository.
2. Installa le dipendenze con `npm install`.
3. Avvia il progetto con `npm start`.

---

## Licenza

Questo progetto è distribuito con licenza MIT.


--- da modificare 
# Installa dipendenze (se non già fatto)
cd frontend
npm init -y
npm install express ejs

# Avvia il backend (porta 3000)
cd ../backend
node app.js

# Avvia il frontend (porta 3001)
cd ../frontend
node server.js