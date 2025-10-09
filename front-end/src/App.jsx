import { useState, useEffect } from 'react' //importa l'hook useState e useEffect
import './App.css'  //importa il file css

function cardTask(task){
  return(
    <div className='card-wrapper' key={task.id}>
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <p>{formatDateTime(task.date)}</p>
      <p>ID: {task.id}</p>
    </div>
    </div>
  );
}

function VisualizzaForm() {
  const [tasks,setTasks]=useState([]); //stato delle task, inizialmente vuoto
  const [originalTasks, setOriginalTasks] = useState([]); //stato delle task originali
  const [isSortedByDeadline, setIsSortedByDeadline] = useState(false); //stato per sapere se è ordinato per scadenza
  const fetchTasks = async () => {
    try{
      const response = await fetch('http://127.0.0.1:8000/get_tasks/',{
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }); //fetch per ottenere le task dal back-end
      if(response.ok){
        const data=await response.json(); //attende la risposta in formato json
        setTasks(data); //aggiorna lo stato delle task con i dati ricevuti
        setOriginalTasks(data); //salva le task originali
      }
   }
   catch{
      alert('Errore di connessione al backend');
      return;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const sortByDeadline = () => {
    if (isSortedByDeadline) {
      setTasks(originalTasks);
      setIsSortedByDeadline(false);
    } else {
      const sorted = [...originalTasks].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTasks(sorted);
      setIsSortedByDeadline(true);
    }
  };

  const syncToCalendar = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/sync_to_calendar/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        alert('Task sincronizzate con Google Calendar!');
      } else {
        alert('Errore nella sincronizzazione.');
      }
    } catch {
      alert('Errore di connessione al backend');
    }
  };

  return (
    <div>
      <h2>Le tue Task</h2>
      <button onClick={sortByDeadline} className='Ordina'>Ordina per scadenza</button>
      {tasks.length > 0 ? (
        tasks.map(task => cardTask(task)) //se task >0 mostra le varie task grazie alla funzione map cheitera su ogni task tramite la funzione cardTask
      ) : (
        <p>Nessuna task presente.</p>
      )}
      <button onClick={syncToCalendar} className='sync_button'>Sincronizza con Google Calendar</button>
    </div>
  );
}

function AggiungiForm() { //funzione che aggiunge un form  per aggiungere una task
  const [title, setTitle] = useState(''); //stato del titolo
  const [description, setDescription] = useState(''); //stato della descrizione
  const [date, setDate] = useState(''); //stato della data

  const handleSubmit = async (e) => { //funzione che gestisce il submit
    e.preventDefault(); //previene il reload della pagina dopo il submit
    // Assicura che la data sia nel formato "YYYY-MM-DDTHH:MM:SS"
    let formattedDate = date; 
    if (formattedDate.length === 16) {
      formattedDate += ":00"; //gestisce la formattazione della data per renderla adatta alla post verso il back-end
    }
    const params = { //parametri da inviare
      id: null, // L'id verrà assegnato dal backend
      title,
      description,
      date: formattedDate,
    };
    try { //contatto con il back-end tramite l'API Fetch
      const response = await fetch('http://127.0.0.1:8000/insert_task/', { //await serve per aspettare la risposta di fetch prima di procedere con il codice
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params), //dobbiamo specificare l'url e il tipo di richiesta in Fetch
        /*Questi sono il metodo della richiesta, un header (dove specifichiamo che passeremo un JSON) e
         i parametri in formato JSON string (diversi dalle stringhe JS)*/
      });
      if (response.ok) { //response.ok è una flag che controlla se il contatto è avvenuto correttamente
        alert('Task aggiunta con successo!'); //notifica browser di successo dell'operazione
        setTitle(''); //azzerra i parametri del form 
        setDescription('');
        setDate('');
      } else {
        alert('Errore nell\'aggiunta della task'); //notifica di operazione non riuscita
      }
    } catch { //se nel blocco si verificano errori legati al fetch stampa un errore
         alert('Errore di connessione al backend');
    }
  };

  return (  //codice HTML del form
    <form className="form" onSubmit={handleSubmit}> 
    {/*Tag del form, una volta eseguito il submit richiama la funzione
    handle submit (dice quale funzione richiamare, passando un puntatore a quella funzione
    e non richiamandola direttamente). Con lo stile della classe form.*/}
      <span className="input-span">  {/*Span serve per indicare del testo che verrà evidenziato attraverso uno stile specifico */}
        <label className="label">Titolo</label>
        <input type="text" placeholder="Titolo" required value={title} onChange={e => setTitle(e.target.value)} />
        {/*onChange permette di identificare un evento di modifica e richiamare la arrow function setTitle su quell'evento che aggiorna lo stato*/}
      </span>
      <span className="input-span">
        <label className="label">Descrizione</label>
        <textarea placeholder="Descrizione" required value={description} onChange={e => setDescription(e.target.value)} style={{ borderRadius: "0.5rem", padding: "1rem 0.75rem", backgroundColor: "#9c9c9c60", border: "none", outline: "2px solid #707070" }} />
        {/*Required value permette di rendere obbligatorio l'inserimento di un valore nel campo, e.target.value legge il valore del target dell'evento*/}
      </span>
      <span className="input-span">
        <label className="label">Data e ora</label>
        <input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} style={{ borderRadius: "0.5rem", padding: "1rem 0.75rem", backgroundColor: "#9c9c9c60", border: "none", outline: "2px solid #707070" }} />
      </span>
      <button type="submit" className="submit">Aggiungi</button>
    </form>
  );
}

function ModificaRimuoviForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [taskId, setTaskId] = useState('');

  const handleUpdate = async (e) => { //funzione che gestisce la modifica della task
    e.preventDefault();
    let formattedDate = date;
    if (formattedDate.length === 16) {
      formattedDate += ":00"; //formattazione data
    }
    const params = {
      id: parseInt(taskId), //convertiamo id in intero
      title,
      description,
      date: formattedDate,
    };
    try {
      const response = await fetch("http://127.0.0.1:8000/update_task/", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (response.ok) {
        alert("Task modificata con successo!");
        setTitle('');
        setDescription('');
        setDate('');
        setTaskId('');
      } else {
        alert("Errore nella modifica della task");
      }
    } catch {
      alert("Errore di connessione al backend");
    }
  };

  const handleRemove = async () => { //funzione che gestisce la rimozione della task
    if (!taskId) {
      alert('Inserisci l\'ID della task da rimuovere');
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/remove_task/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, //passiamo i parametri come dati del form
        body: new URLSearchParams({ task_id: taskId }), //crea una stringa di query codificata in URL con il parametro task_id
      });
      if (response.ok) {
        alert('Task rimossa con successo!');
        setTaskId('');
      } else {
        alert('Errore nella rimozione della task');
      }
    } catch {
      alert('Errore di connessione al backend');
    }
  };

  return (
    <form className="form" onSubmit={handleUpdate}>
      <span>
        <label className="label">ID della task da modificare o rimuovere</label>
        <input type="number" placeholder="ID" required value={taskId} onChange={e => setTaskId(e.target.value)} style={{ borderRadius: "0.5rem", padding: "0.5rem 0.25rem", backgroundColor: "#9c9c9c60", border: "none", outline: "2px solid #707070", margin: "0.3rem" }} />
      </span>
      <span className="input-span">
        <label className="label">Titolo</label>
        <input type="text" placeholder="Titolo" required value={title} onChange={e => setTitle(e.target.value)} />
      </span>
      <span className="input-span">
        <label className="label">Descrizione</label>
        <textarea placeholder="Descrizione" required value={description} onChange={e => setDescription(e.target.value)} style={{ borderRadius: "0.5rem", padding: "1rem 0.75rem", backgroundColor: "#9c9c9c60", border: "none", outline: "2px solid #707070" }} />
      </span>
      <span className="input-span">
        <label className="label">Data e ora</label>
        <input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} style={{ borderRadius: "0.5rem", padding: "1rem 0.75rem", backgroundColor: "#9c9c9c60", border: "none", outline: "2px solid #707070" }} />
      </span>
      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit" className="submit" style={{ flex: 1 }}>Modifica</button>
        <button type="button" onClick={handleRemove} className="remove-button" style={{ flex: 1 }}>Rimuovi</button>
      </div>
    </form>
  );
  //nel submit abbiamo due bottoni, uno per la modifica e uno per la rimozione, entrambi richiamano la stessa funzione handleSubmit, la quale distingue l'azione da compiere leggendo il valore del bottone premuto
}

function App() {
  const [selected, setSelected] = useState(null);

  const renderForm = () => {
    switch (selected) {
      case 'Visualizza':
        return <VisualizzaForm />;
      case 'Aggiungi':
        return <AggiungiForm />;
      case 'Modifica/Rimuovi':
        return <ModificaRimuoviForm />;
      default:
        return null;
    }
  };

  return (
    <div className="App">
      <h1>Welcome to Task manager.</h1>
      <p>Here you can interact with your tasks.</p>
      <div className="card-container">
        <div className="card" onClick={() => setSelected('Visualizza')}>
          <h2>Visualizza Task</h2>
          <p>Guarda tutte le tue task.</p>
        </div>
        <div className="card" onClick={() => setSelected('Aggiungi')}>
          <h2>Aggiungi Task</h2>
          <p>Crea una nuova task.</p>
        </div>
        <div className="card" onClick={() => setSelected('Modifica/Rimuovi')}>
          <h2>Modifica o Rimuovi Task</h2>
          <p>Modifica o elimina una task esistente.</p>
        </div>
      </div>
      <div style={{ marginTop: "2rem" }}>
        {renderForm()}
      </div>
    </div>
  )
}

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  // Se già contiene i secondi, restituisci così com'è
  if (dateStr.length === 19) return dateStr;
  // Se manca, aggiungi ":00"
  if (dateStr.length === 16) return dateStr + ":00";
  return dateStr;
}

export default App
