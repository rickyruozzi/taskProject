from pymongo import MongoClient #client mongo per la connessione con il DB
from fastapi import FastAPI, HTTPException, Form #modulo fastapi per implementare le funzioni del back-end
from pydantic import BaseModel #modulo che permette di dichiarare un basemodel per le task
from typing import List, Optional #permette di utilizzare sintassi tipizzate in python
from datetime import datetime   #serve per importare il tipo di dato datetime
from fastapi.middleware.cors import CORSMiddleware #serve per impostare la CORS policy

client = MongoClient("mongodb://localhost:27017/")  #connessione al client mongo
db=client["taskProject"]    #scelta del DB
collection=db["taskCollection"] #scelta della collezione

app=FastAPI() #inizializza l'app FastApi

# CORS policy: consenti tutte le origini (per sviluppo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione specifica il dominio del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Task(BaseModel):  #definizione del modello di base per le Task
    id: Optional[int] = None
    title: str
    description: str
    date: datetime
    
    
@app.post("/insert_task/", response_model=Task) #endpoint usato per aggiungere task
def insert_task(task: Task):
    # Trova il massimo id esistente
    last_task = collection.find_one(sort=[("id", -1)])  
    #salva in last_task l'id della prima task che trova scorrendo la collezione ordinata per id decrescente
    next_id = (last_task["id"] + 1) if last_task and "id" in last_task else 1
    #se last_task esiste (quindi il documento non è il primo della collezione) e ha un campo id definito, next_task assumerà il suo valore + 1
    task_dict = task.dict() #converte l'oggetto task_dict ricevuto in input (JSON) in un dizionario python  
    task_dict["id"] = next_id #imposta il suo id su next_id 
    #essendo che l'id non viene passato dal front-end esso deve essere opzionale nel base model, altrimenti pydantic causerà un errore
    collection.insert_one(task_dict) #aggiunge la task attraverso il modulo predefinito .insert_one()
    return Task(**task_dict) #ritorna un base model task creato a partire dal dizionario che abbiamo precedentemente aggiunto

@app.post("/remove_task/", response_model=dict)
def remove_task(task_id: int = Form(...)): #stiamo passando task_id come parametro di form, non come json
    result=collection.delete_one({"id":task_id}) #in result ci finirà l'oggetto rimosso dal DB
    if result.deleted_count==0: #se il count degli oggetti rimossi è 0 invochiamo una eccezione
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"message": "Task deleted successfully."} #altrimenti ritorniamo un messaggio di riuscita dell'operazione

@app.get("/get_tasks/", response_model=List[Task])
def get_tasks():
    tasks = list(collection.find()) #restituisce una lista con tutte le taskpresenti nel db
    tasks=reversed(tasks) #inverte l'ordine delle task in modo che le più recenti vengano mostrate per prime
    return tasks    #restituisce questa lista

@app.post("/update_task/", response_model=Task)
def update_task(task: Task):
    result=collection.update_one({"id":task.id}, {"$set": task.dict()})
    #update_one() prende come primo argomento un filtro per trovare il documento da aggiornare, e come secondo argomento un dizionario con i campi da aggiornare
    if result.matched_count==0:
        raise HTTPException(status_code=404, detail='Task not found') 
    #update_one() restituisce il numero di documenti aggiornati, se tale numero è 0 non ci sono stati aggiornamenti
    return task #restituice la task aggiornata

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
